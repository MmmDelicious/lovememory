import { useState, useCallback, useRef } from 'react';
import { ToastData } from '../components/Toast';
let toastIdCounter = 0;
const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const recentToasts = useRef<Map<string, number>>(new Map());
  const addToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    title?: string,
    duration?: number
  ) => {
    const toastKey = `${type}:${title}:${message}`;
    const now = Date.now();
    const lastShown = recentToasts.current.get(toastKey);
    if (lastShown && (now - lastShown) < 1000) {
      return lastShown.toString();
    }
    recentToasts.current.set(toastKey, now);
    for (const [key, timestamp] of recentToasts.current.entries()) {
      if (now - timestamp > 5000) {
        recentToasts.current.delete(key);
      }
    }
    const id = `toast-${++toastIdCounter}`;
    const newToast: ToastData = {
      id,
      type,
      title,
      message,
      duration: Math.max(duration || 5000, 4000), // минимум 4 секунды
    };
    setToasts(prev => {
      const newToasts = [...prev, newToast];
      if (newToasts.length > 3) {
        return newToasts.slice(-3);
      }
      return newToasts;
    });
    return id;
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);
  const showSuccess = useCallback((message: string, title?: string, duration?: number) => {
    return addToast(message, 'success', title, duration);
  }, [addToast]);
  const showError = useCallback((message: string, title?: string, duration?: number) => {
    return addToast(message, 'error', title, duration);
  }, [addToast]);
  const showWarning = useCallback((message: string, title?: string, duration?: number) => {
    return addToast(message, 'warning', title, duration);
  }, [addToast]);
  const showInfo = useCallback((message: string, title?: string, duration?: number) => {
    return addToast(message, 'info', title, duration);
  }, [addToast]);
  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
export default useToast;

