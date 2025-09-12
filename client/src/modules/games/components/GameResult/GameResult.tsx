import React from 'react';
import LottiePlayer from 'react-lottie-player';
import { GameState } from '../../types/gameRoom.types';
import victoryAnimation from '@/shared/assets/victory.json';
import defeatAnimation from '@/shared/assets/defeat.json';
import styles from './GameResult.module.css';

interface GameResultProps {
  gameState: GameState;
  user: any;
  onReturnToLobby: () => void;
}

const GameResult: React.FC<GameResultProps> = ({ gameState, user, onReturnToLobby }) => {
  if (gameState.status !== 'finished' || !gameState.winner) {
    return null;
  }

  const isWinner = gameState.winner.playerId === user.id;
  const resultTitle = isWinner ? 'Победа!' : 'Поражение';
  const resultMessage = isWinner 
    ? 'Поздравляем с победой!' 
    : `${gameState.winner.name} выиграл эту игру`;

  return (
    <div className={styles.gameResult}>
      <div className={styles.animationContainer}>
        <LottiePlayer
          animationData={isWinner ? victoryAnimation : defeatAnimation}
          play
          style={{ width: 200, height: 200 }}
        />
      </div>
      <h2 className={styles.resultTitle}>{resultTitle}</h2>
      <p className={styles.resultMessage}>{resultMessage}</p>
      <button 
        onClick={onReturnToLobby}
        className={styles.returnButton}
      >
        Вернуться в лобби
      </button>
    </div>
  );
};

export default GameResult;
