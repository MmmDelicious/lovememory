import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Coins, 
  Clock,
  Play,
  UserPlus,
  CheckCircle
} from 'lucide-react';
import { Tournament, TournamentStats } from '../../types/models';
import styles from './TournamentCard.module.css';

interface TournamentCardProps {
  tournament: Tournament;
  stats?: TournamentStats;
  userRegistered?: boolean;
  onRegister?: (tournamentId: string) => void;
  onUnregister?: (tournamentId: string) => void;
  isLoading?: boolean;
}

const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  stats,
  userRegistered = false,
  onRegister,
  onUnregister,
  isLoading = false
}) => {
  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'registering': return 'success';
      case 'active': return 'warning';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: Tournament['status']) => {
    switch (status) {
      case 'preparing': return 'Подготовка';
      case 'registering': return 'Регистрация';
      case 'active': return 'Активный';
      case 'completed': return 'Завершен';
      case 'cancelled': return 'Отменен';
    }
  };

  const getTypeText = (type: Tournament['type']) => {
    switch (type) {
      case 'single_elimination': return 'На выбывание';
      case 'double_elimination': return 'Двойное выбывание';
      case 'round_robin': return 'Круговая система';
      case 'swiss': return 'Швейцарская система';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canRegister = tournament.status === 'registering' && 
    !userRegistered && 
    (stats?.registrationStatus === 'open');

  const canUnregister = tournament.status === 'registering' && userRegistered;

  return (
    <div className={`${styles.tournamentCard} ${styles[getStatusColor(tournament.status)]}`}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.iconWrapper}>
            <Trophy size={20} />
          </div>
          <div>
            <h3 className={styles.name}>{tournament.name}</h3>
            <div className={styles.meta}>
              <span className={`${styles.status} ${styles[getStatusColor(tournament.status)]}`}>
                {getStatusText(tournament.status)}
              </span>
              <span className={styles.type}>
                {getTypeText(tournament.type)}
              </span>
            </div>
          </div>
        </div>
        
        {userRegistered && (
          <div className={styles.registeredBadge}>
            <CheckCircle size={16} />
            <span>Участвую</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        {tournament.description && (
          <p className={styles.description}>{tournament.description}</p>
        )}

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Users size={16} />
            <span>
              {stats?.totalParticipants || 0} / {tournament.max_participants}
            </span>
          </div>

          {tournament.entry_fee_coins > 0 && (
            <div className={styles.infoItem}>
              <Coins size={16} />
              <span>{tournament.entry_fee_coins} монет</span>
            </div>
          )}

          {tournament.prize_pool > 0 && (
            <div className={styles.infoItem}>
              <Trophy size={16} />
              <span>Приз: {tournament.prize_pool} монет</span>
            </div>
          )}

          {tournament.start_date && (
            <div className={styles.infoItem}>
              <Calendar size={16} />
              <span>{formatDate(tournament.start_date)}</span>
            </div>
          )}

          {stats?.timeToStart && stats.timeToStart > 0 && (
            <div className={styles.infoItem}>
              <Clock size={16} />
              <span>
                Через {Math.floor(stats.timeToStart / 60)}ч {stats.timeToStart % 60}м
              </span>
            </div>
          )}
        </div>

        {tournament.Creator && (
          <div className={styles.creator}>
            <span>Организатор: {tournament.Creator.display_name || tournament.Creator.first_name}</span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Link 
          to={`/tournaments/${tournament.id}`} 
          className={`${styles.btn} ${styles.btnSecondary}`}
        >
          <Play size={16} />
          Подробнее
        </Link>

        {canRegister && onRegister && (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => onRegister(tournament.id)}
            disabled={isLoading}
          >
            <UserPlus size={16} />
            Участвовать
          </button>
        )}

        {canUnregister && onUnregister && (
          <button
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={() => onUnregister(tournament.id)}
            disabled={isLoading}
          >
            Отменить участие
          </button>
        )}

        {tournament.status === 'active' && userRegistered && (
          <Link 
            to={`/tournaments/${tournament.id}/play`}
            className={`${styles.btn} ${styles.btnSuccess}`}
          >
            <Play size={16} />
            Играть
          </Link>
        )}
      </div>
    </div>
  );
};

export default TournamentCard;
