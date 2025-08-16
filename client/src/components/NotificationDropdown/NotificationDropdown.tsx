import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import styles from './NotificationDropdown.module.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications?: Notification[];
}

// Mock уведомления для демонстрации
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Новое событие',
    message: 'Ваш партнер добавил событие "Романтический ужин"',
    type: 'info',
    isRead: false,
    createdAt: '2 мин назад'
  },
  {
    id: '2',
    title: 'Игра завершена',
    message: 'Партия в шахматы завершена. Вы победили!',
    type: 'success',
    isRead: false,
    createdAt: '1 час назад'
  },
  {
    id: '3',
    title: 'Напоминание',
    message: 'Сегодня день рождения вашего партнера',
    type: 'warning',
    isRead: true,
    createdAt: '2 часа назад'
  }
];

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  notifications = mockNotifications 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationList, setNotificationList] = useState(notifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notificationList.filter(n => !n.isRead).length;

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotificationList(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotificationList(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotificationList(prev => 
      prev.filter(n => n.id !== id)
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  return (
    <div className={styles.notificationDropdown} ref={dropdownRef}>
      <button 
        className={styles.notificationButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Уведомления"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.notificationBadge}>{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Уведомления</h3>
            {unreadCount > 0 && (
              <button 
                className={styles.markAllRead}
                onClick={markAllAsRead}
              >
                <Check size={16} />
                Отметить все
              </button>
            )}
          </div>

          <div className={styles.notificationsList}>
            {notificationList.length === 0 ? (
              <div className={styles.emptyState}>
                <Bell size={24} />
                <p>Нет уведомлений</p>
              </div>
            ) : (
              notificationList.map((notification) => (
                <div 
                  key={notification.id}
                  className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTitle}>
                      {notification.title}
                    </div>
                    <div className={styles.notificationMessage}>
                      {notification.message}
                    </div>
                    <div className={styles.notificationTime}>
                      {notification.createdAt}
                    </div>
                  </div>

                  <button 
                    className={styles.removeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {notificationList.length > 0 && (
            <div className={styles.footer}>
              <button className={styles.clearAll}>
                <Trash2 size={16} />
                Очистить все
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
