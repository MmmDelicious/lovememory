import React from 'react';
import styles from './DifficultyBadge.module.css';

interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
}

/**
 * Переиспользуемый бейдж сложности
 * Чистый UI компонент без бизнес-логики
 */
const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  difficulty,
  size = 'medium',
  showIcon = true,
  className = ''
}) => {
  const getDifficultyInfo = (diff: string) => {
    switch (diff) {
      case 'easy':
        return { label: 'Легко', color: '#4ade80', icon: '●' };
      case 'medium':
        return { label: 'Средне', color: '#fbbf24', icon: '●●' };
      case 'hard':
        return { label: 'Сложно', color: '#f87171', icon: '●●●' };
      default:
        return { label: 'Неизвестно', color: '#9ca3af', icon: '●' };
    }
  };

  const { label, color, icon } = getDifficultyInfo(difficulty);

  return (
    <div 
      className={`${styles.badge} ${styles[size]} ${styles[difficulty]} ${className}`}
      style={{ borderColor: color }}
    >
      {showIcon && (
        <span className={styles.icon} style={{ color }}>
          {icon}
        </span>
      )}
      <span className={styles.label}>{label}</span>
    </div>
  );
};

export default DifficultyBadge;
