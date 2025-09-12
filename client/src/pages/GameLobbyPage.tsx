import React from 'react';
import GameLobbyPage from '../modules/games/pages/GameLobbyPage/GameLobbyPage';

/**
 * Простая страница-роут для лобби игр
 * Только композиция, вся логика в модуле games
 */
const GameLobbyPageRoute: React.FC = () => {
  return <GameLobbyPage />;
};

export default GameLobbyPageRoute;

