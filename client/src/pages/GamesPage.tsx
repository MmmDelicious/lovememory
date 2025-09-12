import React from 'react';
import GamesPage from '../modules/games/pages/GamesPage/GamesPage';

/**
 * Простая страница-роут для игр
 * Только композиция, вся логика в модуле games
 */
const GamesPageRoute: React.FC = () => {
  return <GamesPage />;
};

export default GamesPageRoute;

