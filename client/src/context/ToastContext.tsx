import React, { createContext, useContext, ReactNode } from 'react';
import useToast from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
interface ToastContextType {
  showSuccess: (message: string, title?: string, duration?: number) => string;
  showError: (message: string, title?: string, duration?: number) => string;
  showWarning: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;
  clearAllToasts: () => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);
interface ToastProviderProps {
  children: ReactNode;
}
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAllToasts,
  } = useToast();
  const contextValue: ToastContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAllToasts,
  };
  React.useEffect(() => {
    setGlobalToastContext(contextValue);
  }, [contextValue]);
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ToastContext.Provider>
  );
};
export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
let globalToastContext: ToastContextType | null = null;
export const setGlobalToastContext = (context: ToastContextType) => {
  globalToastContext = context;
};
export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    if (globalToastContext) {
      return globalToastContext.showSuccess(message, title, duration);
    }
    console.warn('Toast context not initialized');
    return '';
  },
  error: (message: string, title?: string, duration?: number) => {
    if (globalToastContext) {
      return globalToastContext.showError(message, title, duration);
    }
    console.warn('Toast context not initialized');
    return '';
  },
  warning: (message: string, title?: string, duration?: number) => {
    if (globalToastContext) {
      return globalToastContext.showWarning(message, title, duration);
    }
    console.warn('Toast context not initialized');
    return '';
  },
  info: (message: string, title?: string, duration?: number) => {
    if (globalToastContext) {
      return globalToastContext.showInfo(message, title, duration);
    }
    console.warn('Toast context not initialized');
    return '';
  },
  clear: () => {
    if (globalToastContext) {
      globalToastContext.clearAllToasts();
    }
    console.warn('Toast context not initialized');
  }
};

