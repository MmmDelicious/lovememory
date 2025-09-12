import React from 'react';
import { GamesList, CategoriesFilter, FeaturedGames } from '../../../../components/games';
import { useGames } from '../../hooks/useGames';
import styles from './GamesModule.module.css';

interface GamesModuleProps {
  onGameClick: (gameId: string) => void;
  className?: string;
}

/**
 * Модуль игр - самостоятельный модуль со своей бизнес-логикой
 * Содержит состояние, API вызовы, обработку ошибок
 * Использует компоненты из слоя Components
 */
const GamesModule: React.FC<GamesModuleProps> = ({
  onGameClick,
  className = ''
}) => {
  const {
    filteredGames,
    featuredGames,
    categories,
    selectedCategory,
    setSelectedCategory,
    hoveredGame,
    setHoveredGame
  } = useGames();

  // Подсчет игр по категориям
  const gameCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(category => {
      if (category === 'Все') {
        counts[category] = filteredGames.length;
      } else {
        counts[category] = filteredGames.filter(game => game.category === category).length;
      }
    });
    return counts;
  }, [categories, filteredGames]);

  // Данные загружаются статично из конфигурации, loading состояния не нужны

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Hero секция */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Игры для двоих</h1>
        <p className={styles.heroSubtitle}>
          Укрепите отношения с помощью увлекательных игр, созданных специально для пар
        </p>
      </div>

      {/* Рекомендуемые игры */}
      <FeaturedGames
        games={featuredGames}
        onGameClick={onGameClick}
        hoveredGame={hoveredGame}
        onGameHover={setHoveredGame}
      />

      {/* Фильтр по категориям */}
      <CategoriesFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        gameCounts={gameCounts}
      />

      {/* Список всех игр */}
      <section className={styles.gamesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {selectedCategory === 'Все' ? 'Все игры' : `Категория: ${selectedCategory}`}
          </h2>
          <p className={styles.gameCount}>
            {filteredGames.length} {filteredGames.length === 1 ? 'игра' : 'игр'}
          </p>
        </div>
        
        <GamesList
          games={filteredGames}
          onGameClick={onGameClick}
          hoveredGame={hoveredGame}
          onGameHover={setHoveredGame}
        />
      </section>
    </div>
  );
};

export default GamesModule;
