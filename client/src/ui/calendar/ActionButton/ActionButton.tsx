import React from 'react';
import { IconType } from 'react-icons';
import styles from './ActionButton.module.css';

export interface ActionButtonProps {
  children: React.ReactNode;
  icon?: IconType;
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  title?: string;
}

/**
 * Базовый UI компонент кнопки действия
 * Не содержит бизнес-логики, только представление
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  icon: Icon,
  variant = 'default',
  size = 'medium',
  isLoading = false,
  disabled = false,
  className,
  onClick,
  type = 'button',
  fullWidth = false,
  title
}) => {
  const buttonClass = `
    ${styles.actionButton}
    ${styles[variant]}
    ${styles[size]}
    ${fullWidth ? styles.fullWidth : ''}
    ${isLoading ? styles.loading : ''}
    ${disabled ? styles.disabled : ''}
    ${className || ''}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button 
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || isLoading}
      type={type}
      title={title}
    >
      {isLoading ? (
        <span className={styles.spinner} />
      ) : Icon ? (
        <Icon className={styles.icon} />
      ) : null}
      
      <span className={styles.content}>{children}</span>
    </button>
  );
};
