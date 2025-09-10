import React, { createContext, useContext, ReactNode } from 'react';
import { ToastContainer } from '../shared/components/Toast/ToastContainer';
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
  const [toasts, setToasts] = React.useState<any[]>([]);
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const showSuccess = (message: string, title?: string, duration?: number) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, title, type: 'success', duration }]);
    return id;
  };
  
  const showError = (message: string, title?: string, duration?: number) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, title, type: 'error', duration }]);
    return id;
  };
  
  const showWarning = (message: string, title?: string, duration?: number) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, title, type: 'warning', duration }]);
    return id;
  };
  
  const showInfo = (message: string, title?: string, duration?: number) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, title, type: 'info', duration }]);
    return id;
  };
  
  const clearAllToasts = () => {
    setToasts([]);
  };
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
    return '';
  },
  error: (message: string, title?: string, duration?: number) => {
    if (globalToastContext) {
      return globalToastContext.showError(message, title, duration);
    }
    return '';
  },
  warning: (message: string, title?: string, duration?: number) => {
    if (globalToastContext) {
      return globalToastContext.showWarning(message, title, duration);
    }
    return '';
  },
  info: (message: string, title?: string, duration?: number) => {
    if (globalToastContext) {
      return globalToastContext.showInfo(message, title, duration);
    }
    return '';
  },
  clear: () => {
    if (globalToastContext) {
      globalToastContext.clearAllToasts();
    }
  }
};

