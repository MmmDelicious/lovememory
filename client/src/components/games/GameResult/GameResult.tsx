import React from 'react';
import { FaTrophy, FaHandshake, FaRedo, FaHome } from 'react-icons/fa';
import styles from './GameResult.module.css';

interface Player {
  id: string;
  name: string;
  symbol?: string;
  score: number;
}

interface GameResultProps {
  winner: 'X' | 'O' | 'draw' | null;
  players: Player[];
  userPlayer: Player | undefined;
  moves: number;
  timeElapsed?: number;
  onNewGame?: () => void;
  onReturnToLobby?: () => void;
  className?: string;
}

/**
 * Компонент результата игры
 * Отображает итоги без бизнес-логики
 */
export const GameResult: React.FC<GameResultProps> = ({
  winner,
  players,
  userPlayer,
  moves,
  timeElapsed,
  onNewGame,
  onReturnToLobby,
  className
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getResultTitle = (): string => {
    if (winner === 'draw') return 'Ничья!';
    if (winner && userPlayer?.symbol === winner) return 'Вы победили!';
    if (winner) return 'Вы проиграли!';
    return 'Игра завершена';
  };

  const getResultIcon = () => {
    if (winner === 'draw') return FaHandshake;
    return FaTrophy;
  };

  const getResultColor = (): string => {
    if (winner === 'draw') return styles.draw;
    if (winner && userPlayer?.symbol === winner) return styles.win;
    return styles.lose;
  };

  const ResultIcon = getResultIcon();
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className={`${styles.gameResult} ${getResultColor()} ${className || ''}`}>
      <div className={styles.resultHeader}>
        <div className={styles.resultIcon}>
          <ResultIcon />
        </div>
        <h2 className={styles.resultTitle}>{getResultTitle()}</h2>
      </div>

      <div className={styles.gameStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Ходов сделано:</span>
          <span className={styles.statValue}>{moves}</span>
        </div>
        
        {timeElapsed !== undefined && (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Время игры:</span>
            <span className={styles.statValue}>{formatTime(timeElapsed)}</span>
          </div>
        )}
      </div>

      {players.length > 1 && (
        <div className={styles.playersResults}>
          <h3 className={styles.playersTitle}>Результаты игроков</h3>
          <div className={styles.playersList}>
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id}
                className={`${styles.playerResult} ${
                  player.id === userPlayer?.id ? styles.currentUser : ''
                }`}
              >
                <div className={styles.playerRank}>#{index + 1}</div>
                <div className={styles.playerInfo}>
                  <div className={styles.playerName}>
                    {player.name} {player.id === userPlayer?.id && '(Вы)'}
                  </div>
                  {player.symbol && (
                    <div className={styles.playerSymbol}>{player.symbol}</div>
                  )}
                </div>
                <div className={styles.playerScore}>{player.score} очков</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actionButtons}>
        {onNewGame && (
          <button 
            className={styles.newGameButton}
            onClick={onNewGame}
          >
            <FaRedo />
            <span>Новая игра</span>
          </button>
        )}
        
        {onReturnToLobby && (
          <button 
            className={styles.lobbyButton}
            onClick={onReturnToLobby}
          >
            <FaHome />
            <span>В лобби</span>
          </button>
        )}
      </div>
    </div>
  );
};
