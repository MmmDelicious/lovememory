import { useState, useMemo } from 'react';
import { GAMES, CATEGORIES, getRandomGame, type Game } from '../config/games.config';

export const useGames = () => {
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  const filteredGames = useMemo(() => {
    return selectedCategory === 'Все' 
      ? GAMES 
      : GAMES.filter(game => game.category === selectedCategory);
  }, [selectedCategory]);

  const featuredGames = useMemo(() => {
    return GAMES.filter(game => game.featured).slice(0, 4);
  }, []);

  const handleRandomGame = () => {
    const randomGame = getRandomGame();
    window.location.href = randomGame.path;
  };

  return {
    games: GAMES,
    filteredGames,
    featuredGames,
    categories: CATEGORIES,
    selectedCategory,
    setSelectedCategory,
    hoveredGame,
    setHoveredGame,
    handleRandomGame
  };
};
