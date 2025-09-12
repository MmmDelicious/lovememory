import React from 'react';
import { GameCard } from '../../../ui/games';
import { GAME_ICONS } from '../../../modules/games/config/games.config';
import { Game } from '../../../modules/games/config/games.config';
import styles from './GamesList.module.css';

interface GamesListProps {
  games: Game[];
  onGameClick: (gameId: string) => void;
  hoveredGame?: string | null;
  onGameHover?: (gameId: string | null) => void;
  className?: string;
}

/**
 * Компонент списка игр
 * Использует UI компоненты, содержит минимальную логику отображения
 */
const GamesList: React.FC<GamesListProps> = ({
  games,
  onGameClick,
  hoveredGame,
  onGameHover,
  className = ''
}) => {
  if (games.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>Игры не найдены</p>
        <p className={styles.emptySubtext}>Попробуйте изменить фильтры поиска</p>
      </div>
    );
  }

  return (
    <div className={`${styles.grid} ${className}`}>
      {games.map((game) => {
        const IconComponent = GAME_ICONS[game.iconName];
        
        return (
          <GameCard
            key={game.id}
            title={game.name}
            description={game.description}
            icon={IconComponent}
            image={game.image}
            gradient={game.gradient}
            difficulty={game.difficulty}
            players={game.players}
            duration={game.duration}
            featured={game.featured}
            onClick={() => onGameClick(game.id)}
            onMouseEnter={() => onGameHover?.(game.id)}
            onMouseLeave={() => onGameHover?.(null)}
            isHovered={hoveredGame === game.id}
          />
        );
      })}
    </div>
  );
};

export default GamesList;
