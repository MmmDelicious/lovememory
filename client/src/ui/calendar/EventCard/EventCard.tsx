import React from 'react';
import { IconType } from 'react-icons';
import styles from './EventCard.module.css';

export interface EventCardProps {
  title: string;
  time?: string;
  description?: string;
  color: string;
  icon?: IconType;
  isShared?: boolean;
  isImportant?: boolean;
  isCompleted?: boolean;
  className?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

/**
 * Базовый UI компонент карточки события
 * Не содержит бизнес-логики, только представление
 */
export const EventCard: React.FC<EventCardProps> = ({
  title,
  time,
  description,
  color,
  icon: Icon,
  isShared,
  isImportant,
  isCompleted,
  className,
  onClick,
  onEdit,
  onDelete,
  children
}) => {
  return (
    <div 
      className={`
        ${styles.eventCard} 
        ${className || ''} 
        ${onClick ? styles.clickable : ''}
        ${isCompleted ? styles.completed : ''}
      `}
      onClick={onClick}
      style={{ borderLeftColor: color }}
    >
      <div className={styles.header}>
        {Icon && (
          <div 
            className={styles.icon}
            style={{ backgroundColor: `${color}20`, color }}
          >
            <Icon />
          </div>
        )}
        
        <div className={styles.content}>
          <div className={styles.titleRow}>
            <h4 className={styles.title}>{title}</h4>
            <div className={styles.badges}>
              {isShared && (
                <span className={styles.badge}>Общее</span>
              )}
              {isImportant && (
                <span className={`${styles.badge} ${styles.important}`}>
                  Важно
                </span>
              )}
              {isCompleted && (
                <span className={`${styles.badge} ${styles.completed}`}>
                  ✓ Готово
                </span>
              )}
            </div>
          </div>
          
          {time && (
            <div className={styles.time}>{time}</div>
          )}
          
          {description && (
            <div className={styles.description}>{description}</div>
          )}
        </div>
        
        {(onEdit || onDelete) && (
          <div className={styles.actions}>
            {onEdit && (
              <button 
                className={styles.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                title="Редактировать"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button 
                className={styles.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Удалить"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
      
      {children && (
        <div className={styles.footer}>
          {children}
        </div>
      )}
    </div>
  );
};
