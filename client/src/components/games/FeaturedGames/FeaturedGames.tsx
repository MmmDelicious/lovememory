import React from 'react';
import { Star } from 'lucide-react';
import { GameCard } from '../../../ui/games';
import { GAME_ICONS } from '../../../modules/games/config/games.config';
import { Game } from '../../../modules/games/config/games.config';
import styles from './FeaturedGames.module.css';

interface FeaturedGamesProps {
  games: Game[];
  onGameClick: (gameId: string) => void;
  hoveredGame?: string | null;
  onGameHover?: (gameId: string | null) => void;
  className?: string;
}

/**
 * Компонент рекомендуемых игр
 * Использует UI компоненты, содержит логику отображения избранных игр
 */
const FeaturedGames: React.FC<FeaturedGamesProps> = ({
  games,
  onGameClick,
  hoveredGame,
  onGameHover,
  className = ''
}) => {
  if (games.length === 0) {
    return null;
  }

  return (
    <section className={`${styles.section} ${className}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Star size={20} className={styles.icon} />
          Рекомендуемые игры
        </h2>
        <p className={styles.subtitle}>
          Лучшие игры для укрепления отношений
        </p>
      </div>
      
      <div className={styles.grid}>
        {games.map((game) => {
          const IconComponent = GAME_ICONS[game.iconName];
          
          return (
            <GameCard
              key={game.id}
              title={game.name}
              description={game.longDescription}
              icon={IconComponent}
              image={game.image}
              gradient={game.gradient}
              difficulty={game.difficulty}
              players={game.players}
              duration={game.duration}
              featured={true}
              onClick={() => onGameClick(game.id)}
              onMouseEnter={() => onGameHover?.(game.id)}
              onMouseLeave={() => onGameHover?.(null)}
              isHovered={hoveredGame === game.id}
            />
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedGames;
