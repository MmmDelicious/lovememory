import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './GameCard.module.css';

interface GameCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  image?: string;
  gradient?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  players?: string;
  duration?: string;
  featured?: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isHovered?: boolean;
  className?: string;
}

/**
 * Переиспользуемая карточка игры
 * Чистый UI компонент без бизнес-логики
 */
const GameCard: React.FC<GameCardProps> = ({
  title,
  description,
  icon: Icon,
  image,
  gradient,
  difficulty,
  players,
  duration,
  featured = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isHovered = false,
  className = ''
}) => {
  const cardStyle = gradient ? { background: gradient } : {};
  
  const getDifficultyColor = (diff?: string) => {
    switch (diff) {
      case 'easy': return '#4ade80';
      case 'medium': return '#fbbf24';
      case 'hard': return '#f87171';
      default: return '#9ca3af';
    }
  };

  return (
    <div
      className={`${styles.card} ${featured ? styles.featured : ''} ${isHovered ? styles.hovered : ''} ${className}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={cardStyle}
    >
      {featured && (
        <div className={styles.featuredBadge}>
          Рекомендуемая
        </div>
      )}
      
      {image && (
        <div className={styles.imageContainer}>
          <img src={image} alt={title} className={styles.image} />
        </div>
      )}
      
      <div className={styles.content}>
        <div className={styles.header}>
          {Icon && (
            <div className={styles.iconContainer}>
              <Icon size={24} className={styles.icon} />
            </div>
          )}
          <h3 className={styles.title}>{title}</h3>
        </div>
        
        <p className={styles.description}>{description}</p>
        
        <div className={styles.meta}>
          {difficulty && (
            <div className={styles.metaItem}>
              <div 
                className={styles.difficultyDot} 
                style={{ backgroundColor: getDifficultyColor(difficulty) }}
              />
              <span className={styles.metaText}>
                {difficulty === 'easy' ? 'Легко' : difficulty === 'medium' ? 'Средне' : 'Сложно'}
              </span>
            </div>
          )}
          
          {players && (
            <div className={styles.metaItem}>
              <span className={styles.metaText}>{players} игр.</span>
            </div>
          )}
          
          {duration && (
            <div className={styles.metaItem}>
              <span className={styles.metaText}>{duration}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.overlay} />
    </div>
  );
};

export default GameCard;
