import React from 'react';
import { Tournament, TournamentMatch, GameParticipant } from '../../types/models';
import { Play, Clock, CheckCircle2, Trophy, Users } from 'lucide-react';
import styles from './TournamentBracket.module.css';

interface TournamentBracketProps {
  tournament: Tournament;
  matches: TournamentMatch[];
  participants: GameParticipant[];
  currentRound: number;
  totalRounds: number;
  userParticipation?: GameParticipant;
  onMatchAction?: (matchId: string) => void;
}

interface MatchWithParticipants extends TournamentMatch {
  participant1?: GameParticipant;
  participant2?: GameParticipant;
  winner?: GameParticipant;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  matches,
  participants,
  currentRound,
  totalRounds,
  userParticipation,
  onMatchAction
}) => {
  // Группируем матчи по раундам
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, TournamentMatch[]>);

  // Находим участников для матча
  const getMatchWithParticipants = (match: TournamentMatch): MatchWithParticipants => {
    const participant1 = participants.find(p => p.id === match.participant1_id);
    const participant2 = participants.find(p => p.id === match.participant2_id);
    const winner = participants.find(p => p.id === match.winner_id);
    
    return {
      ...match,
      participant1,
      participant2,
      winner
    };
  };

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#94a3b8';
      case 'waiting': return '#f59e0b';
      case 'active': return '#10b981';
      case 'completed': return '#8b5cf6';
      default: return '#94a3b8';
    }
  };

  const getMatchStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидание';
      case 'waiting': return 'Готовы';
      case 'active': return 'Идет игра';
      case 'completed': return 'Завершен';
      default: return status;
    }
  };

  const formatUserName = (participant?: GameParticipant) => {
    if (!participant?.User) return 'TBA';
    return participant.User.display_name || participant.User.first_name || 'Игрок';
  };

  const isUserMatch = (match: MatchWithParticipants) => {
    if (!userParticipation) return false;
    return match.participant1_id === userParticipation.id || 
           match.participant2_id === userParticipation.id;
  };

  const renderParticipantCard = (
    participant: GameParticipant | undefined, 
    isWinner: boolean, 
    position: 'top' | 'bottom'
  ) => (
    <div className={`${styles.participantCard} ${isWinner ? styles.winner : ''} ${styles[position]}`}>
      <div className={styles.avatar}>
        {participant?.User?.avatarUrl ? (
          <img src={participant.User.avatarUrl} alt="" />
        ) : (
          <Users size={16} />
        )}
      </div>
      <span className={styles.participantName}>
        {formatUserName(participant)}
      </span>
      {isWinner && <Trophy size={14} className={styles.trophyIcon} />}
    </div>
  );

  const renderMatch = (match: TournamentMatch, roundIndex: number) => {
    const matchWithParticipants = getMatchWithParticipants(match);
    const isHighlighted = isUserMatch(matchWithParticipants);
    const statusColor = getMatchStatusColor(match.status);

    return (
      <div 
        key={match.id}
        className={`${styles.matchCard} ${isHighlighted ? styles.highlighted : ''}`}
        style={{ '--status-color': statusColor } as React.CSSProperties}
      >
        {/* Match Header */}
        <div className={styles.matchHeader}>
          <div className={styles.matchStatus}>
            <div 
              className={styles.statusDot}
              style={{ backgroundColor: statusColor }}
            />
            <span>{getMatchStatusText(match.status)}</span>
          </div>
          {match.status === 'waiting' && onMatchAction && isHighlighted && (
            <button 
              className={styles.actionButton}
              onClick={() => onMatchAction(match.id)}
            >
              <Play size={14} />
              Играть
            </button>
          )}
        </div>

        {/* Participants */}
        <div className={styles.participants}>
          {renderParticipantCard(
            matchWithParticipants.participant1,
            matchWithParticipants.winner_id === matchWithParticipants.participant1_id,
            'top'
          )}
          
          <div className={styles.vs}>VS</div>
          
          {renderParticipantCard(
            matchWithParticipants.participant2,
            matchWithParticipants.winner_id === matchWithParticipants.participant2_id,
            'bottom'
          )}
        </div>

        {/* Match Footer */}
        <div className={styles.matchFooter}>
          <span className={styles.matchPosition}>
            Раунд {match.round} • Позиция {match.position + 1}
          </span>
          {match.status === 'completed' && (
            <CheckCircle2 size={16} className={styles.completedIcon} />
          )}
        </div>
      </div>
    );
  };

  const renderRound = (roundNumber: number) => {
    const roundMatches = matchesByRound[roundNumber] || [];
    const roundName = getRoundName(roundNumber, totalRounds);
    const isCurrentRound = roundNumber === currentRound;

    return (
      <div 
        key={roundNumber}
        className={`${styles.round} ${isCurrentRound ? styles.currentRound : ''}`}
      >
        <div className={styles.roundHeader}>
          <h3 className={styles.roundTitle}>{roundName}</h3>
          {isCurrentRound && (
            <div className={styles.currentBadge}>
              <Clock size={14} />
              Текущий
            </div>
          )}
        </div>
        
        <div className={styles.roundMatches}>
          {roundMatches
            .sort((a, b) => a.position - b.position)
            .map(match => renderMatch(match, roundNumber - 1))}
        </div>
        
        {/* Connecting Lines */}
        {roundNumber < totalRounds && (
          <div className={styles.connections}>
            {Array.from({ length: Math.ceil(roundMatches.length / 2) }).map((_, i) => (
              <div key={i} className={styles.connectionLine} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const getRoundName = (roundNumber: number, totalRounds: number) => {
    const roundsFromEnd = totalRounds - roundNumber + 1;
    
    switch (roundsFromEnd) {
      case 1: return 'Финал';
      case 2: return 'Полуфинал';
      case 3: return 'Четвертьфинал';
      case 4: return '1/8 финала';
      case 5: return '1/16 финала';
      default: return `Раунд ${roundNumber}`;
    }
  };

  if (matches.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Trophy size={48} />
        <h3>Сетка не сформирована</h3>
        <p>Ожидайте начала турнира</p>
      </div>
    );
  }

  return (
    <div className={styles.bracket}>
      <div className={styles.bracketContainer}>
        {Array.from({ length: totalRounds }, (_, i) => i + 1).map(renderRound)}
      </div>
    </div>
  );
};
