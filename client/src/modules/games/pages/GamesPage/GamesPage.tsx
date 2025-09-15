import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GamesModule, TournamentModule } from '../../modules';
import styles from './GamesPage.module.css';

const GamesPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGameClick = (gameId: string) => {
    navigate(`/games/${gameId}`);
  };

  const handleTournamentJoin = (tournamentId: string) => {
  };

  const handleTournamentView = (tournamentId: string) => {
    navigate(`/tournaments/${tournamentId}`);
  };

  return (
    <div className={styles.container}>
      <GamesModule 
        onGameClick={handleGameClick} 
        className={styles.gamesModule}
      />
      
      <TournamentModule 
        onTournamentJoin={handleTournamentJoin}
        onTournamentView={handleTournamentView}
        className={styles.tournamentModule}
      />
    </div>
  );
};

export default GamesPage;