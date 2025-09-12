import React from 'react';
import { FaArrowLeft, FaClock, FaUsers } from 'react-icons/fa';
import styles from './GameHeader.module.css';

interface Player {
  id: string;
  name: string;
  symbol?: string;
  score?: number;
}

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  players?: Player[];
  currentPlayer?: string;
  moves?: number;
  timeElapsed?: number;
  onReturnToLobby?: () => void;
  className?: string;
}

/**
 * Компонент заголовка игры
 * Отображает информацию о игре без бизнес-логики
 */
export const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  subtitle,
  players = [],
  currentPlayer,
  moves = 0,
  timeElapsed,
  onReturnToLobby,
  className
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className={`${styles.gameHeader} ${className || ''}`}>
      <div className={styles.headerTop}>
        {onReturnToLobby && (
          <button 
            className={styles.backButton}
            onClick={onReturnToLobby}
          >
            <FaArrowLeft />
            <span>Назад</span>
          </button>
        )}
        
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div className={styles.gameInfo}>
          {timeElapsed !== undefined && (
            <div className={styles.infoItem}>
              <FaClock className={styles.infoIcon} />
              <span>{formatTime(timeElapsed)}</span>
            </div>
          )}
          
          <div className={styles.infoItem}>
            <FaUsers className={styles.infoIcon} />
            <span>{players.length}</span>
          </div>
          
          {moves > 0 && (
            <div className={styles.infoItem}>
              <span className={styles.movesLabel}>Ходов:</span>
              <span className={styles.movesCount}>{moves}</span>
            </div>
          )}
        </div>
      </div>

      {players.length > 0 && (
        <div className={styles.playersBar}>
          {players.map(player => (
            <div 
              key={player.id}
              className={`${styles.playerChip} ${
                currentPlayer === player.symbol || currentPlayer === player.id 
                  ? styles.activePlayer 
                  : ''
              }`}
            >
              {player.symbol && (
                <span className={styles.playerSymbol}>{player.symbol}</span>
              )}
              <span className={styles.playerName}>{player.name}</span>
              {player.score !== undefined && (
                <span className={styles.playerScore}>{player.score}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  );
};
