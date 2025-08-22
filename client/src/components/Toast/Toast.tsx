import React, { useEffect, useState, useCallback } from 'react';
export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}
const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const handleClose = useCallback(() => {
    if (isExiting) return; // Предотвращаем двойное закрытие
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Синхронизировано с CSS анимацией выхода
  }, [isExiting, onClose, id]);
  useEffect(() => {
    console.log(`Toast ${id}: duration = ${duration}ms`); // Debug log
    const enterTimer = setTimeout(() => {
      setIsEntering(false);
    }, 400);
    const minDuration = Math.max(duration, 4000); // увеличиваем минимум до 4 секунд
    console.log(`Toast ${id}: will close after ${minDuration}ms`); // Debug log
    const closeTimer = setTimeout(() => {
      console.log(`Toast ${id}: auto-closing now`); // Debug log
      handleClose();
    }, minDuration);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, handleClose, id]);
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'i';
      default:
        return 'i';
    }
  };
  const toastClasses = [
    'toast',
    `toast--${type}`,
    isEntering && 'toast--entering',
    isExiting && 'toast--exiting',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={toastClasses}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>
      <button 
        className="toast-close" 
        onClick={handleClose}
        aria-label="Закрыть уведомление"
      >
        ×
      </button>
      <div 
        className="toast-progress" 
        style={{ animationDuration: `${Math.max(duration, 4000)}ms` }}
      />
    </div>
  );
};
export default Toast;

