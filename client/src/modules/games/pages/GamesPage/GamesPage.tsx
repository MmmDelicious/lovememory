import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GamesModule, TournamentModule } from '../../modules';
import styles from './GamesPage.module.css';

/**
 * Тонкая страница игр
 * Содержит только навигационную логику, всю бизнес-логику делегирует модулям
 */
const GamesPage: React.FC = () => {
  const navigate = useNavigate();

  // Обработчики навигации
  const handleGameClick = (gameId: string) => {
    navigate(`/games/${gameId}`);
  };

  const handleTournamentJoin = (tournamentId: string) => {
    // TODO: Логика присоединения к турниру
    console.log('Joining tournament:', tournamentId);
  };

  const handleTournamentView = (tournamentId: string) => {
    navigate(`/tournaments/${tournamentId}`);
  };

  return (
    <div className={styles.container}>
      {/* Модуль основных игр */}
      <GamesModule 
        onGameClick={handleGameClick} 
        className={styles.gamesModule}
      />
      
      {/* Модуль турниров */}
      <TournamentModule 
        onTournamentJoin={handleTournamentJoin}
        onTournamentView={handleTournamentView}
        className={styles.tournamentModule}
      />
    </div>
  );
};

export default GamesPage;