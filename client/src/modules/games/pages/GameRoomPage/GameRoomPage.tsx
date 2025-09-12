import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@/store';
import { useGameSocket } from '../../hooks/useGameSocket';
import QuizGame from '../../components/QuizGame/QuizGame';
import ChessGame from '../../components/ChessGame/ChessGameEnhanced';
import WordleGame from '../../components/WordleGame/WordleGame';
import CodenamesGame from '../../components/CodenamesGame/CodenamesGame';
import MemoryGameComponent from '../../components/MemoryGame/MemoryGameComponent';
import GameStatusMessage from '../../components/GameStatusMessage/GameStatusMessage';
import GameResult from '../../components/GameResult/GameResult';
import styles from './GameRoomPage.module.css';

const GameRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = useUser();
  const token = user?.token;
  const { gameState, makeMove } = useGameSocket(roomId, token, () => {});
  const [isMakingMove, setIsMakingMove] = useState(false);

  const handleReturnToLobby = () => {
    const gameType = gameState?.gameType || 'unknown';
    navigate(`/games/${gameType}`);
  };

  const handleMakeMove = async (move: any) => {
    if (isMakingMove) return;
    
    setIsMakingMove(true);
    try {
      await makeMove(move);
    } catch (error) {
      console.error('Error making move:', error);
    } finally {
      setIsMakingMove(false);
    }
  };

  const renderGame = () => {
    if (!gameState) return null;

    const gameProps = {
      gameState,
      makeMove: handleMakeMove,
      isLoading: isMakingMove,
      user
    };

    switch (gameState.gameType) {
      case 'quiz':
        return <QuizGame {...gameProps} />;
      case 'chess':
        return <ChessGame {...gameProps} />;
      case 'wordle':
        return <WordleGame {...gameProps} />;
      case 'codenames':
        return <CodenamesGame {...gameProps} />;
      case 'memory':
        return <MemoryGameComponent {...gameProps} />;
      default:
        return (
          <div className={styles.unknownGame}>
            <h3>Неизвестный тип игры: {gameState.gameType}</h3>
            <button onClick={handleReturnToLobby} className={styles.returnButton}>
              Вернуться в лобби
            </button>
          </div>
        );
    }
  };

  if (!roomId) {
    return (
      <div className={styles.error}>
        <h2>Комната не найдена</h2>
        <button onClick={() => navigate('/games')} className={styles.returnButton}>
          Вернуться к играм
        </button>
      </div>
    );
  }

  return (
    <div className={styles.gameRoom}>
      <div className={styles.header}>
        <div className={styles.gameInfo}>
          <h1 className={styles.title}>
            {gameState?.gameType ? `Игра: ${gameState.gameType}` : 'Игровая комната'}
          </h1>
          <div className={styles.status}>
            <GameStatusMessage gameState={gameState} user={user} />
          </div>
        </div>
        
        {gameState?.status !== 'finished' && (
          <button 
            onClick={handleReturnToLobby}
            className={styles.leaveButton}
          >
            Покинуть игру
          </button>
        )}
      </div>

      <div className={styles.gameContent}>
        {gameState?.status === 'finished' ? (
          <GameResult 
            gameState={gameState} 
            user={user} 
            onReturnToLobby={handleReturnToLobby} 
          />
        ) : (
          renderGame()
        )}
      </div>
    </div>
  );
};

export default GameRoomPage;
