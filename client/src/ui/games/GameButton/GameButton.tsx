import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './GameButton.module.css';

interface GameButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}

/**
 * Переиспользуемая кнопка для игр
 * Чистый UI компонент без бизнес-логики
 */
const GameButton: React.FC<GameButtonProps> = ({
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  children,
  icon: Icon,
  loading = false,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
    >
      {loading ? (
        <div className={styles.spinner} />
      ) : (
        <>
          {Icon && <Icon size={size === 'small' ? 16 : size === 'large' ? 24 : 20} />}
          {children}
        </>
      )}
    </button>
  );
};

export default GameButton;
