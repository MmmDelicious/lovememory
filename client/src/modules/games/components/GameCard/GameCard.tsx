import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Trophy, ChevronRight } from 'lucide-react';
import { Game, getDifficultyColor, getDifficultyLabel, GAME_ICONS } from '../../config/games.config';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: Game;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  isHovered, 
  onMouseEnter, 
  onMouseLeave 
}) => {
  return (
    <Link
      to={game.path}
      className={styles.gameCard}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.gameCardImage}>
        <img src={game.image} alt={game.name} />
        <div className={styles.gameCardOverlay}></div>
        <div className={styles.gameCardBadge}>
          <span 
            className={styles.difficultyBadge}
            style={{ backgroundColor: getDifficultyColor(game.difficulty) }}
          >
            {getDifficultyLabel(game.difficulty)}
          </span>
        </div>
      </div>
      <div className={styles.gameCardContent}>
        <div className={styles.gameCardHeader}>
          <div className={styles.gameCardIcon}>
            {React.createElement(GAME_ICONS[game.iconName], { size: 20 })}
          </div>
          <div className={styles.gameCardCategory}>
            {game.category}
          </div>
        </div>
        <div className={styles.gameCardInfo}>
          <h3 className={styles.gameCardTitle}>{game.name}</h3>
          <p className={styles.gameCardDescription}>{game.description}</p>
          <div className={styles.gameCardMeta}>
            <span>
              <Users size={12} />
              {game.playersText}
            </span>
            <span>
              <Trophy size={12} />
              {game.duration}
            </span>
          </div>
        </div>
        <div className={styles.gameCardAction}>
          <span>Играть</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
