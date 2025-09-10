import React, { useState, useEffect } from 'react';
import { Tournament, TournamentMatch, GameParticipant } from '../../types/models';
import { Clock, Users, CheckCircle2, Play, RefreshCw, Trophy } from 'lucide-react';
import styles from './TournamentLobby.module.css';

interface TournamentLobbyProps {
  tournament: Tournament;
  matches: TournamentMatch[];
  participants: GameParticipant[];
  userParticipation?: GameParticipant;
  onReady: (matchId: string) => void;
  onRefresh: () => void;
}

export const TournamentLobby: React.FC<TournamentLobbyProps> = ({
  tournament,
  matches,
  participants,
  userParticipation,
  onReady,
  onRefresh
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Обновляем таймер каждую секунду
  useEffect(() => {
    const updateTimer = () => {
      if (tournament.start_date) {
        const now = new Date().getTime();
        const startTime = new Date(tournament.start_date).getTime();
        const difference = startTime - now;

        if (difference > 0) {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          
          setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeLeft('00:00:00');
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tournament.start_date]);

  // Находим текущий матч пользователя
  const userCurrentMatch = matches.find(match => 
    (match.participant1_id === userParticipation?.id || 
     match.participant2_id === userParticipation?.id) &&
    (match.status === 'pending' || match.status === 'waiting')
  );

  // Проверяем, готов ли пользователь
  const isUserReady = userCurrentMatch?.metadata?.ready_participants?.includes(userParticipation?.id) || false;

  const formatUserName = (participant: GameParticipant) => {
    return participant.User?.display_name || 
           participant.User?.first_name || 
           `Игрок ${participant.id.slice(-4)}`;
  };

  const getReadyCount = (match: TournamentMatch) => {
    return match.metadata?.ready_participants?.length || 0;
  };

  const renderTimer = () => {
    if (tournament.status === 'registering') {
      return (
        <div className={styles.timerSection}>
          <div className={styles.timerIcon}>
            <Clock size={32} />
          </div>
          <div className={styles.timerContent}>
            <h3>Начинается через</h3>
            <div className={styles.timer}>
              {timeLeft || '00:00:00'}
            </div>
            <p>Подготовьтесь к турниру!</p>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderParticipantsList = () => (
    <div className={styles.participantsSection}>
      <div className={styles.sectionHeader}>
        <Users size={20} />
        <h3>Участники ({participants.length})</h3>
        <button onClick={onRefresh} className={styles.refreshButton}>
          <RefreshCw size={16} />
        </button>
      </div>
      
      <div className={styles.participantsList}>
        {participants.map((participant, index) => (
          <div 
            key={participant.id}
            className={`${styles.participantItem} ${participant.id === userParticipation?.id ? styles.currentUser : ''}`}
          >
            <div className={styles.participantRank}>#{index + 1}</div>
            
            <div className={styles.participantAvatar}>
              {participant.User?.avatarUrl ? (
                <img src={participant.User.avatarUrl} alt="" />
              ) : (
                <Users size={20} />
              )}
            </div>
            
            <div className={styles.participantInfo}>
              <span className={styles.participantName}>
                {formatUserName(participant)}
              </span>
              {participant.id === userParticipation?.id && (
                <span className={styles.youLabel}>Вы</span>
              )}
            </div>
            
            <div className={styles.participantStatus}>
              <CheckCircle2 size={16} className={styles.readyIcon} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCurrentMatch = () => {
    if (!userCurrentMatch || !userParticipation) return null;

    const opponent = userCurrentMatch.participant1_id === userParticipation.id
      ? participants.find(p => p.id === userCurrentMatch.participant2_id)
      : participants.find(p => p.id === userCurrentMatch.participant1_id);

    const readyCount = getReadyCount(userCurrentMatch);

    return (
      <div className={styles.currentMatchSection}>
        <div className={styles.sectionHeader}>
          <Play size={20} />
          <h3>Ваш текущий матч</h3>
        </div>
        
        <div className={styles.matchInfo}>
          <div className={styles.vsSection}>
            <div className={styles.playerCard}>
              <div className={styles.playerAvatar}>
                {userParticipation.User?.avatarUrl ? (
                  <img src={userParticipation.User.avatarUrl} alt="" />
                ) : (
                  <Users size={24} />
                )}
              </div>
              <span className={styles.playerName}>Вы</span>
              {isUserReady && <CheckCircle2 size={16} className={styles.readyBadge} />}
            </div>
            
            <div className={styles.vsIndicator}>VS</div>
            
            <div className={styles.playerCard}>
              <div className={styles.playerAvatar}>
                {opponent?.User?.avatarUrl ? (
                  <img src={opponent.User.avatarUrl} alt="" />
                ) : (
                  <Users size={24} />
                )}
              </div>
              <span className={styles.playerName}>
                {opponent ? formatUserName(opponent) : 'Ожидание'}
              </span>
              {opponent && getReadyCount(userCurrentMatch) > (isUserReady ? 1 : 0) && (
                <CheckCircle2 size={16} className={styles.readyBadge} />
              )}
            </div>
          </div>
          
          <div className={styles.matchStatus}>
            <p>Готовность: {readyCount} / 2</p>
            {userCurrentMatch.status === 'waiting' && (
              <p className={styles.waitingText}>Все готовы! Ожидание начала матча...</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderReadyButton = () => {
    if (!userCurrentMatch || !userParticipation) return null;

    if (userCurrentMatch.status === 'waiting') {
      return (
        <div className={styles.readySection}>
          <div className={styles.allReadyMessage}>
            <CheckCircle2 size={24} />
            <span>Все участники готовы!</span>
            <p>Ожидайте начала матча</p>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.readySection}>
        <button
          className={`${styles.readyButton} ${isUserReady ? styles.ready : ''}`}
          onClick={() => onReady(userCurrentMatch.id)}
          disabled={isUserReady}
        >
          {isUserReady ? (
            <>
              <CheckCircle2 size={24} />
              Готов!
            </>
          ) : (
            <>
              <Clock size={24} />
              Готов к игре
            </>
          )}
        </button>
        
        <p className={styles.readyHint}>
          {isUserReady 
            ? 'Ожидайте готовности соперника'
            : 'Нажмите, когда будете готовы к матчу'
          }
        </p>
      </div>
    );
  };

  return (
    <div className={styles.lobby}>
      {/* Timer Section */}
      {renderTimer()}

      {/* Current Match Section */}
      {renderCurrentMatch()}

      {/* Ready Button */}
      {renderReadyButton()}

      {/* Participants List */}
      {renderParticipantsList()}
    </div>
  );
};
