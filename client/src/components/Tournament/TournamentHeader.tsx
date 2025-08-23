import React from 'react';
import { Tournament } from '../../types/models';
import { ArrowLeft, Trophy, Users, Clock, Calendar, Coins } from 'lucide-react';
import styles from './TournamentHeader.module.css';

interface TournamentHeaderProps {
  tournament: Tournament;
  currentRound: number;
  totalRounds: number;
  participantsCount: number;
  onBack: () => void;
}

export const TournamentHeader: React.FC<TournamentHeaderProps> = ({
  tournament,
  currentRound,
  totalRounds,
  participantsCount,
  onBack
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registering': return '#22c55e';
      case 'active': return '#f59e0b';
      case 'completed': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registering': return 'Регистрация';
      case 'active': return 'Активный';
      case 'completed': return 'Завершен';
      default: return status;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.header}>
      {/* Back Button */}
      <button onClick={onBack} className={styles.backButton}>
        <ArrowLeft size={20} />
        <span>Турниры</span>
      </button>

      {/* Tournament Info */}
      <div className={styles.tournamentInfo}>
        <div className={styles.mainInfo}>
          <div className={styles.titleSection}>
            <div className={styles.iconWrapper}>
              <Trophy size={32} />
            </div>
            <div className={styles.textInfo}>
              <h1 className={styles.title}>{tournament.name}</h1>
              {tournament.description && (
                <p className={styles.description}>{tournament.description}</p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div 
            className={styles.statusBadge}
            style={{ backgroundColor: getStatusColor(tournament.status) }}
          >
            {getStatusText(tournament.status)}
          </div>
        </div>

        {/* Tournament Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <Users size={20} />
            <span>{participantsCount} / {tournament.max_participants}</span>
            <small>участников</small>
          </div>

          {tournament.status === 'active' && (
            <div className={styles.statItem}>
              <Clock size={20} />
              <span>Раунд {currentRound} / {totalRounds}</span>
              <small>прогресс</small>
            </div>
          )}

          {tournament.entry_fee_coins > 0 && (
            <div className={styles.statItem}>
              <Coins size={20} />
              <span>{tournament.entry_fee_coins}</span>
              <small>взнос</small>
            </div>
          )}

          {tournament.start_date && (
            <div className={styles.statItem}>
              <Calendar size={20} />
              <span>{formatDate(tournament.start_date)}</span>
              <small>начало</small>
            </div>
          )}
        </div>

        {/* Tournament Type */}
        <div className={styles.typeInfo}>
          <span className={styles.typeLabel}>Тип:</span>
          <span className={styles.typeValue}>
            {tournament.type === 'single_elimination' && 'На выбывание'}
            {tournament.type === 'double_elimination' && 'Двойное выбывание'}
            {tournament.type === 'round_robin' && 'Круговой'}
            {tournament.type === 'swiss' && 'Швейцарская система'}
          </span>
        </div>
      </div>
    </div>
  );
};
