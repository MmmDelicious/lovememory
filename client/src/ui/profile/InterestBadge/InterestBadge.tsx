import React from 'react';
import { Heart, ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import styles from './InterestBadge.module.css';

interface InterestBadgeProps {
  name: string;
  emoji?: string;
  preference: 'love' | 'like' | 'neutral' | 'dislike';
  intensity?: number;
  onClick?: () => void;
  onRemove?: () => void;
  showIntensity?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Переиспользуемый бейдж интереса
 * Чистый UI компонент без бизнес-логики
 */
const InterestBadge: React.FC<InterestBadgeProps> = ({
  name,
  emoji,
  preference,
  intensity,
  onClick,
  onRemove,
  showIntensity = false,
  size = 'medium',
  className = ''
}) => {
  const getPreferenceIcon = () => {
    switch (preference) {
      case 'love': return <Heart size={14} />;
      case 'like': return <ThumbsUp size={14} />;
      case 'neutral': return <Minus size={14} />;
      case 'dislike': return <ThumbsDown size={14} />;
      default: return null;
    }
  };

  const getIntensityBars = () => {
    if (!showIntensity || !intensity) return null;
    
    const bars = [];
    for (let i = 1; i <= 5; i++) {
      bars.push(
        <div
          key={i}
          className={`${styles.intensityBar} ${i <= intensity ? styles.active : ''}`}
        />
      );
    }
    return bars;
  };

  return (
    <div 
      className={`${styles.badge} ${styles[preference]} ${styles[size]} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
    >
      <div className={styles.content}>
        {emoji && <span className={styles.emoji}>{emoji}</span>}
        <span className={styles.name}>{name}</span>
        
        <div className={styles.preferenceIcon}>
          {getPreferenceIcon()}
        </div>
      </div>
      
      {showIntensity && intensity && (
        <div className={styles.intensityContainer}>
          {getIntensityBars()}
        </div>
      )}
      
      {onRemove && (
        <button 
          className={styles.removeButton}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Удалить ${name}`}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default InterestBadge;
