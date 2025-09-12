import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TournamentModule } from '../../modules';
import styles from './TournamentsPage.module.css';

/**
 * Тонкая страница турниров
 * Содержит только навигационную логику, всю бизнес-логику делегирует модулю TournamentModule
 */
const TournamentsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleTournamentJoin = (tournamentId: string) => {
    // TODO: Логика присоединения к турниру
    console.log('Joining tournament:', tournamentId);
    // navigate('/tournament/join', { state: { tournamentId } });
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