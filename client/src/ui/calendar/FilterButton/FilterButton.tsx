import React from 'react';
import { IconType } from 'react-icons';
import styles from './FilterButton.module.css';

export interface FilterButtonProps {
  label: string;
  icon?: IconType;
  isActive?: boolean;
  count?: number;
  color?: string;
  variant?: 'default' | 'primary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Базовый UI компонент кнопки фильтра
 * Не содержит бизнес-логики, только представление
 */
export const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  icon: Icon,
  isActive = false,
  count,
  color,
  variant = 'default',
  size = 'medium',
  className,
  onClick,
  disabled = false
}) => {
  const buttonClass = `
    ${styles.filterButton}
    ${styles[variant]}
    ${styles[size]}
    ${isActive ? styles.active : ''}
    ${disabled ? styles.disabled : ''}
    ${className || ''}
  `.trim().replace(/\s+/g, ' ');

  const buttonStyle = color && isActive ? {
    backgroundColor: `${color}15`,
    borderColor: color,
    color: color
  } : {};

  return (
    <button 
      className={buttonClass}
      style={buttonStyle}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {Icon && (
        <Icon className={styles.icon} />
      )}
      
      <span className={styles.label}>{label}</span>
      
      {count !== undefined && count > 0 && (
        <span className={styles.count}>{count}</span>
      )}
      
      {color && !isActive && (
        <span 
          className={styles.colorDot}
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
};
