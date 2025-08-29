import React, { useState, useEffect, useCallback } from 'react';
import MemoryCard from './MemoryCard';
import styles from './MemoryGame.module.css';
import '../../index.css';

interface MemoryGameProps {
  gameState: any;
  user: { id: string; email: string };
  makeMove: (cardId: number) => void;
  handleReturnToLobby: () => void;
}

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  position: number;
}

const MemoryGame: React.FC<MemoryGameProps> = ({ 
  gameState, 
  user, 
  makeMove, 
  handleReturnToLobby 
}) => {
  const [localFlippedCards, setLocalFlippedCards] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastMoveTime, setLastMoveTime] = useState<number>(0);

  const {
    status = 'waiting',
    players = [],
    currentPlayerId,
    cards = [],
    scores = {},
    moves = {},
    winner,
    difficulty = 'easy',
    matchedPairs = [],
    totalPairs = 0
  } = gameState || {};

  const currentPlayer = players.find(p => p.id === user.id);
  const isPlayerTurn = currentPlayerId === user.id;
  const gameFinished = status === 'finished';

  // Calculate grid layout based on difficulty
  const getGridLayout = () => {
    switch (difficulty) {
      case 'easy':
        return { cols: 6, rows: 4 };
      case 'medium':
        return { cols: 6, rows: 6 };
      case 'hard':
        return { cols: 8, rows: 6 };
      default:
        return { cols: 6, rows: 4 };
    }
  };

  const { cols, rows } = getGridLayout();

  // Сброс локального состояния при изменении состояния игры
  useEffect(() => {
    if (gameState && gameState.status === 'in_progress') {
      setLocalFlippedCards([]);
      setIsProcessing(false);
    }
  }, [gameState?.status]);

  // Сброс локального состояния при смене хода
  useEffect(() => {
    if (gameState && gameState.currentPlayerId !== currentPlayerId) {
      setLocalFlippedCards([]);
      setIsProcessing(false);
    }
  }, [gameState?.currentPlayerId, currentPlayerId]);

  // Синхронизация с серверным состоянием карточек
  useEffect(() => {
    if (gameState && gameState.cards) {
      // Сбрасываем локальные карточки, если они не совпадают с серверными
      const serverFlippedCards = gameState.cards
        .filter((card: Card) => card.isFlipped && !card.isMatched)
        .map((card: Card) => card.id);
      
      if (JSON.stringify(serverFlippedCards.sort()) !== JSON.stringify(localFlippedCards.sort())) {
        setLocalFlippedCards(serverFlippedCards);
      }
    }
  }, [gameState?.cards, localFlippedCards]);

  const handleCardClick = useCallback((cardId: number) => {
    // Защита от множественных кликов
    const now = Date.now();
    if (now - lastMoveTime < 500) {
      return;
    }

    if (!isPlayerTurn || isProcessing || gameFinished) {
      return;
    }

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isMatched || card.isFlipped) {
      return;
    }

    // СТРОГАЯ проверка - игрок не может открыть больше 2 карт за ход
    if (localFlippedCards.length >= 2) {
      return;
    }

    // Проверяем, что карта еще не открыта локально
    if (localFlippedCards.includes(cardId)) {
      return;
    }

    setLastMoveTime(now);
    
    // Add to local flipped cards for immediate feedback
    setLocalFlippedCards(prev => [...prev, cardId]);
    
    // If this is the second card, set processing state
    if (localFlippedCards.length === 1) {
      setIsProcessing(true);
    }

    // Отправляем ход на сервер
    try {
      makeMove(cardId);
    } catch (error) {
      console.error('Ошибка при отправке хода:', error);
      // Откатываем локальное состояние при ошибке
      setLocalFlippedCards(prev => prev.filter(id => id !== cardId));
      setIsProcessing(false);
    }
  }, [isPlayerTurn, isProcessing, gameFinished, cards, localFlippedCards, makeMove, lastMoveTime]);

  const getCurrentPlayerName = () => {
    const player = players.find(p => p.id === currentPlayerId);
    return player?.name || 'Неизвестный игрок';
  };

  const getWinnerName = () => {
    if (!winner) return '';
    const player = players.find(p => p.id === winner.id);
    return player?.name || 'Неизвестный игрок';
  };

  const getProgressPercentage = () => {
    return (matchedPairs.length / totalPairs) * 100;
  };

  if (status === 'waiting') {
    return (
      <div className={styles.container}>
        <div className={styles.waitingScreen}>
          <h2>Ожидание игроков...</h2>
          <p>Нужно 2 игрока для начала игры</p>
          <div className={styles.playerList}>
            {players.map((player, index) => (
              <div key={`player-${index}`} className={styles.playerItem}>
                <span className={styles.playerName}>{player.name}</span>
                <span className={styles.playerStatus}>Готов</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.container}>
        <div className={styles.errorScreen}>
          <h2>Ошибка в игре</h2>
          <p>{gameState.error || 'Произошла неизвестная ошибка'}</p>
          <button 
            className={styles.returnButton}
            onClick={handleReturnToLobby}
          >
            Вернуться в лобби
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Game Header */}
      <div className={styles.gameHeader}>
        <div className={styles.gameInfo}>
          <h2>Игра Мемори</h2>
          <div className={styles.difficulty}>
            Сложность: {difficulty === 'easy' ? 'Легко' : difficulty === 'medium' ? 'Средне' : 'Сложно'}
          </div>
        </div>
        
        <div className={styles.gameStats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Прогресс:</span>
            <span className={styles.statValue}>{matchedPairs.length}/{totalPairs}</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Player Status */}
      <div className={styles.playerStatus}>
        <div className={styles.currentPlayer}>
          <span className={styles.statusLabel}>Ход:</span>
          <span className={`${styles.playerName} ${isPlayerTurn ? styles.active : ''}`}>
            {getCurrentPlayerName()}
          </span>
        </div>
        {isPlayerTurn && (
          <div className={styles.turnInfo}>
            <span>Открыто карт: {localFlippedCards.length}/2</span>
          </div>
        )}
      </div>

      {/* Game Board */}
      <div className={styles.gameBoard}>
        <div 
          className={styles.cardsGrid}
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`
          }}
        >
          {cards.map((card, index) => (
            <MemoryCard
              key={`memory-${index}`}
              id={card.id}
              value={card.value}
              isFlipped={card.isFlipped || localFlippedCards.includes(card.id)}
              isMatched={card.isMatched}
              onClick={() => handleCardClick(card.id)}
              disabled={!isPlayerTurn || isProcessing || gameFinished || card.isMatched}
              className={localFlippedCards.includes(card.id) ? 'flipping' : ''}
            />
          ))}
        </div>
      </div>

      {/* Player Scores */}
      <div className={styles.playerScores}>
        {players.map((player, index) => (
          <div key={`score-${index}`} className={styles.playerScore}>
            <div className={styles.playerInfo}>
              <span className={styles.playerName}>
                {player.name}
                {player.id === user.id && ' (Вы)'}
              </span>
              <span className={styles.playerStatus}>
                {player.id === currentPlayerId ? 'Ходит' : 'Ожидает'}
              </span>
            </div>
            <div className={styles.scoreInfo}>
              <span className={styles.score}>Очки: {scores[player.id] || 0}</span>
              <span className={styles.moves}>Ходы: {moves[player.id] || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Game Over Screen */}
      {gameFinished && (
        <div className={styles.gameOver}>
          <div className={styles.gameOverContent}>
            <h2>Игра завершена!</h2>
            {winner && (
              <div className={styles.winner}>
                <span className={styles.winnerLabel}>Победитель:</span>
                <span className={styles.winnerName}>{getWinnerName()}</span>
                <span className={styles.winnerScore}>Очки: {winner.score}</span>
              </div>
            )}
            <button 
              className={styles.returnButton}
              onClick={handleReturnToLobby}
            >
              Вернуться в лобби
            </button>
          </div>
        </div>
      )}

      {/* Return to Lobby Button */}
      {!gameFinished && (
        <div className={styles.actions}>
          <button 
            className={styles.returnButton}
            onClick={handleReturnToLobby}
          >
            Покинуть игру
          </button>
        </div>
      )}
    </div>
  );
};

export default MemoryGame;
