import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LottiePlayer from 'react-lottie-player';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useGameSocket } from '../../hooks/useGameSocket';

import QuizGame from '../../components/QuizGame/QuizGame';
import ChessGame from '../../components/ChessGame/ChessGame';
import WordleGame from '../../components/WordleGame/WordleGame';
import styles from './GameRoomPage.module.css';
import victoryAnimation from '../../assets/victory.json';
import defeatAnimation from '../../assets/defeat.json';

const GameRoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { setCoins } = useCurrency();
  const { gameState, makeMove } = useGameSocket(roomId, token, setCoins);
  const [isMakingMove, setIsMakingMove] = React.useState(false);

  const handleReturnToLobby = () => {
    const gameType = gameState?.gameType || 'unknown';
    navigate(`/games/${gameType}`);
  };

  const renderStatusMessage = () => {
    if (!gameState || !user) return "Подключение к игре...";
    if (gameState.status === 'finished') return "Игра окончена";
    if (gameState.status !== 'in_progress') return "Ожидание второго игрока...";

    if (gameState.gameType === 'quiz') {
      return "Время для квиза!";
    }

    if (gameState.gameType === 'chess') {
      return gameState.currentPlayerId === user.id ? "Ваш ход" : "Ход соперника";
    }

    return gameState.currentPlayerId === user.id ? "Ваш ход" : "Ход соперника";
  };
  
  const renderGameBoard = () => {
    if (!gameState) return <div className={styles.boardPlaceholder}>Загрузка игровой доски...</div>;
    if (gameState.status === 'finished' && gameState.gameType !== 'quiz') return renderGameEndOverlay();

    switch (gameState.gameType) {
      case 'tic-tac-toe':
        return (
          <div className={styles.ticTacToeBoard}>
            {(gameState.board || Array(9).fill(null)).map((cell, index) => (
              <div key={index}
                className={`${styles.cell} ${cell ? styles.filled : ''} ${gameState.status !== 'in_progress' || gameState.currentPlayerId !== user.id ? styles.disabled : ''} ${isMakingMove ? styles.loading : ''}`}
                onClick={() => {
                  if (isMakingMove || gameState.status !== 'in_progress' || gameState.currentPlayerId !== user.id || cell !== null) {
                    return;
                  }
                  
                  setIsMakingMove(true);
                  try {
                    makeMove(index);
                  } catch (error) {
                    console.error('[GameRoomPage] Error making move:', error);
                  } finally {
                    setTimeout(() => {
                      setIsMakingMove(false);
                    }, 500);
                  }
                }}>
                {cell === 'X' && <span className={styles.cellX}>{cell}</span>}
                {cell === 'O' && <span className={styles.cellO}>{cell}</span>}
              </div>
            ))}
          </div>
        );
      case 'chess':
        return <ChessGame 
                  gameState={gameState} 
                  user={user} 
                  makeMove={makeMove}
                  token={token}
                  roomId={roomId}
               />;
      case 'quiz':
        return <QuizGame 
                  gameState={gameState} 
                  user={user} 
                  makeMove={makeMove} 
                  handleReturnToLobby={handleReturnToLobby} 
               />;
      case 'wordle':
        return <WordleGame 
                  gameState={gameState} 
                  user={user} 
                  makeMove={makeMove} 
                  handleReturnToLobby={handleReturnToLobby} 
               />;
      default:
        return <div className={styles.boardPlaceholder}>Неизвестный тип игры.</div>;
    }
  };
  
  const renderGameEndOverlay = () => {
    let resultText, resultStyle, animationData;
    if (gameState.winner === 'draw') {
      resultText = 'Ничья!';
      resultStyle = styles.drawText;
    } else if (gameState.winner === user.id) {
      resultText = 'Победа!';
      resultStyle = styles.winnerText;
      animationData = victoryAnimation;
    } else {
      resultText = 'Поражение';
      resultStyle = styles.loserText;
      animationData = defeatAnimation;
    }

    return (
      <div className={styles.overlay}>
        <div className={styles.overlayContent}>
          {animationData && <LottiePlayer loop={false} play animationData={animationData} className={styles.lottieAnimation} />}
          <h2 className={resultStyle}>{resultText}</h2>
          <button onClick={handleReturnToLobby} className={styles.lobbyButton}>Вернуться в лобби</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameRoomContainer}>
      <button onClick={handleReturnToLobby} className={styles.exitButton}>
        Выйти
      </button>
      <div className={styles.gameArea}>
        <h1 className={styles.title}>Комната #{roomId.substring(0, 6)}</h1>
        <h2 className={styles.status}>{renderStatusMessage()}</h2>
        {renderGameBoard()}
      </div>
    </div>
  );
};

export default GameRoomPage;