import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/store';
import { gamesAPI } from '@api/games';
import { TournamentBracket } from '../../components/Tournament/TournamentBracket';
import { TournamentLobby } from '../../components/Tournament/TournamentLobby';
import { TournamentHeader } from '../../components/Tournament/TournamentHeader';
import ErrorDisplay from '@/shared/components/ErrorDisplay/ErrorDisplay';
import { Tournament, TournamentMatch, GameParticipant } from '../../types/models';
import { ArrowLeft, Trophy, Users, Clock } from 'lucide-react';
import styles from './TournamentPage.module.css';

interface TournamentState {
  tournament: Tournament;
  matches: TournamentMatch[];
  participants: GameParticipant[];
  currentRound: number;
  totalRounds: number;
}

export const TournamentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUser();
  
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'bracket' | 'lobby'>('bracket');

  useEffect(() => {
    if (id) {
      loadTournamentState();
  
      const interval = setInterval(loadTournamentState, 5000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const loadTournamentState = async () => {
    try {
      setError(null);
      const response = await tournamentService.getTournamentLobby(id!);
      setTournamentState(response.data);
    } catch (error) {
      console.error('Error loading tournament:', error);
      setError('Не удалось загрузить турнир');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/games/tournaments');
  };

  const handleReadyToggle = async (matchId: string) => {
    try {
      await tournamentService.setMatchReady(id!, matchId);
      loadTournamentState();
    } catch (error) {
      console.error('Error setting ready:', error);
    }
  };

  const handleStartMatch = async (matchId: string) => {
    try {
      await tournamentService.startMatch(id!, matchId);
      loadTournamentState();
    } catch (error) {
      console.error('Error starting match:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
        </div>
        <p>Загрузка турнира...</p>
      </div>
    );
  }

  if (error || !tournamentState) {
    return (
      <div className={styles.errorContainer}>
        <ErrorDisplay 
          errorCode={404}
          errorMessage={error || 'Турнир не найден'} 
          onGoHome={handleGoBack}
        />
      </div>
    );
  }

  const { tournament, matches, participants, currentRound, totalRounds } = tournamentState;
  

  const userParticipation = participants.find(p => p.user_id === user?.id);
  const isParticipant = !!userParticipation;

  return (
    <div className={styles.tournamentPage}>
      {/* Header */}
      <TournamentHeader 
        tournament={tournament}
        currentRound={currentRound}
        totalRounds={totalRounds}
        participantsCount={participants.length}
        onBack={handleGoBack}
      />

      {/* Navigation */}
      <div className={styles.navigation}>
        <button 
          className={`${styles.navButton} ${activeView === 'bracket' ? styles.active : ''}`}
          onClick={() => setActiveView('bracket')}
        >
          <Trophy size={20} />
          Сетка турнира
        </button>
        
        {(isParticipant || tournament.status === 'registering') && (
          <button 
            className={`${styles.navButton} ${activeView === 'lobby' ? styles.active : ''}`}
            onClick={() => setActiveView('lobby')}
          >
            <Users size={20} />
            Лобби
          </button>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeView === 'bracket' && (
          <TournamentBracket 
            tournament={tournament}
            matches={matches}
            participants={participants}
            currentRound={currentRound}
            totalRounds={totalRounds}
            userParticipation={userParticipation}
            onMatchAction={handleStartMatch}
          />
        )}

        {activeView === 'lobby' && (
          <TournamentLobby 
            tournament={tournament}
            matches={matches}
            participants={participants}
            userParticipation={userParticipation}
            onReady={handleReadyToggle}
            onRefresh={loadTournamentState}
          />
        )}
      </div>
    </div>
  );
};
