import React from 'react';
import { Trophy, Calendar, Users } from 'lucide-react';
import { GameButton, DifficultyBadge } from '../../../ui/games';
import styles from './TournamentCard.module.css';

interface Tournament {
  id: string;
  name: string;
  description: string;
  prize: string;
  startDate: string;
  endDate: string;
  participantsCount: number;
  maxParticipants: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'upcoming' | 'active' | 'ended';
  image?: string;
}

interface TournamentCardProps {
  tournament: Tournament;
  onJoin: (tournamentId: string) => void;
  onView: (tournamentId: string) => void;
  className?: string;
}

/**
 * Компонент карточки турнира
 * Использует UI компоненты, содержит логику отображения турнира
 */
const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onJoin,
  onView,
  className = ''
}) => {
  const isJoinable = tournament.status === 'upcoming' && 
    tournament.participantsCount < tournament.maxParticipants;
  const isActive = tournament.status === 'active';
  const isEnded = tournament.status === 'ended';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = () => {
    switch (tournament.status) {
      case 'upcoming': return 'Скоро начнется';
      case 'active': return 'Идет сейчас';
      case 'ended': return 'Завершен';
      default: return '';
    }
  };

  const getStatusColor = () => {
    switch (tournament.status) {
      case 'upcoming': return '#3b82f6';
      case 'active': return '#10b981';
      case 'ended': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div className={`${styles.card} ${className}`}>
      {tournament.image && (
        <div className={styles.imageContainer}>
          <img src={tournament.image} alt={tournament.name} className={styles.image} />
          <div className={styles.statusBadge} style={{ background: getStatusColor() }}>
            {getStatusText()}
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h3 className={styles.title}>{tournament.name}</h3>
            <DifficultyBadge difficulty={tournament.difficulty} size="small" />
          </div>
          
          <div className={styles.prize}>
            <Trophy size={16} className={styles.prizeIcon} />
            <span className={styles.prizeText}>{tournament.prize}</span>
          </div>
        </div>

        <p className={styles.description}>{tournament.description}</p>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <Calendar size={16} className={styles.metaIcon} />
            <span className={styles.metaText}>
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </span>
          </div>
          
          <div className={styles.metaItem}>
            <Users size={16} className={styles.metaIcon} />
            <span className={styles.metaText}>
              {tournament.participantsCount}/{tournament.maxParticipants} участников
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          {isJoinable && (
            <GameButton
              onClick={() => onJoin(tournament.id)}
              variant="primary"
              size="medium"
            >
              Участвовать
            </GameButton>
          )}
          
          {isActive && (
            <GameButton
              onClick={() => onView(tournament.id)}
              variant="success"
              size="medium"
            >
              Смотреть
            </GameButton>
          )}
          
          {isEnded && (
            <GameButton
              onClick={() => onView(tournament.id)}
              variant="secondary"
              size="medium"
            >
              Результаты
            </GameButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
