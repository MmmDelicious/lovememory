import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TournamentModule } from '../../modules';
import styles from './TournamentsPage.module.css';

const TournamentsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleTournamentJoin = (tournamentId: string) => {
  };

  const handleTournamentView = (tournamentId: string) => {
    navigate(`/tournaments/${tournamentId}`);
  };

  return (
    <div className={styles.container}>
      <TournamentModule 
        onTournamentJoin={handleTournamentJoin}
        onTournamentView={handleTournamentView}
      />
    </div>
  );
};

export default TournamentsPage;