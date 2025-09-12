import React from 'react';
import { Users } from 'lucide-react';
import styles from './PlayersIndicator.module.css';

interface PlayersIndicatorProps {
  players: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
}

/**
 * Переиспользуемый индикатор количества игроков
 * Чистый UI компонент без бизнес-логики
 */
const PlayersIndicator: React.FC<PlayersIndicatorProps> = ({
  players,
  size = 'medium',
  showIcon = true,
  className = ''
}) => {
  const getIconSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'large': return 20;
      default: return 16;
    }
  };

  return (
    <div className={`${styles.indicator} ${styles[size]} ${className}`}>
      {showIcon && <Users size={getIconSize()} className={styles.icon} />}
      <span className={styles.text}>{players} игр.</span>
    </div>
  );
};

export default PlayersIndicator;
