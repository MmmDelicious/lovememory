import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './StatCard.module.css';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Переиспользуемая карточка статистики
 * Чистый UI компонент без бизнес-логики
 */
const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  color = 'blue',
  loading = false,
  onClick,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`${styles.card} ${styles.loading} ${className}`}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonIcon} />
          <div className={styles.skeletonText} />
          <div className={styles.skeletonValue} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.card} ${styles[color]} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
    >
      <div className={styles.iconContainer}>
        <Icon size={24} className={styles.icon} />
      </div>
      
      <div className={styles.content}>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>{value}</div>
        
        {trend && trendValue && (
          <div className={`${styles.trend} ${styles[trend]}`}>
            <span className={styles.trendValue}>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
