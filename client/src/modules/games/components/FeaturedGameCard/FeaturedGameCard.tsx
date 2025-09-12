import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Trophy, Play } from 'lucide-react';
import { Game, GAME_ICONS } from '../../config/games.config';
import styles from './FeaturedGameCard.module.css';

interface FeaturedGameCardProps {
  game: Game;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const FeaturedGameCard: React.FC<FeaturedGameCardProps> = ({ 
  game, 
  isHovered, 
  onMouseEnter, 
  onMouseLeave 
}) => {
  return (
    <Link
      to={game.path}
      className={styles.featuredCard}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.featuredCardImage}>
        <img src={game.image} alt={game.name} />
        <div className={styles.featuredCardOverlay}></div>
        <div className={styles.featuredCardContent}>
          <h3 className={styles.featuredCardTitle}>{game.name}</h3>
          <p className={styles.featuredCardDescription}>
            {game.shortReason || game.description}
          </p>
        </div>
        {isHovered && (
          <div className={styles.featuredCardHover}>
            <div className={styles.featuredCardHoverContent}>
              <div className={styles.featuredCardIcon}>
                {React.createElement(GAME_ICONS[game.iconName], { size: 24 })}
              </div>
              <h4 className={styles.featuredCardHoverTitle}>{game.name}</h4>
              <p className={styles.featuredCardHoverDescription}>
                {game.longDescription}
              </p>
              <div className={styles.featuredCardMeta}>
                <span className={styles.metaItem}>
                  <Users size={12} />
                  {game.playersText}
                </span>
                <span className={styles.metaItem}>
                  <Trophy size={12} />
                  {game.duration}
                </span>
              </div>
              <div className={styles.featuredCardPlayButton}>
                <Play size={16} />
                Играть
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default FeaturedGameCard;
