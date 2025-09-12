import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { MemoryBoard, MemoryControls, MemoryStats } from '../../../../components/games';
import { useGameSocket } from '../../hooks/useGameSocket';
import { useMemoryGame } from '../../hooks/useMemoryGame';
import styles from './MemoryModule.module.css';

interface MemoryModuleProps {
  gameId: string;
  userId: string;
  onGameEnd?: (result: any) => void;
  onReturnToLobby?: () => void;
  className?: string;
}

interface MemoryCard {
  id: string;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  index: number;
}

interface Player {
  id: string;
  name: string;
  score: number;
  matches: number;
  moves: number;
}

/**
 * Модуль игры "Мемори" - самостоятельный модуль со своей бизнес-логикой
 * Отвечает за: логику карточной игры, состояние карт, подсчет очков, таймер
 * Использует компоненты из слоя Components для отображения
 */
export const MemoryModule: React.FC<MemoryModuleProps> = ({
  gameId,
  userId,
  onGameEnd,
  onReturnToLobby,
  className
}) => {
  // Состояние модуля
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<string>('');
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Игровой сокет
  const { gameState, makeMove, sendMessage, isConnected, error } = useGameSocket({
    gameId,
    userId,
    gameType: 'memory'
  });

  // Хук для логики мемори игры
  const {
    initializeCards,
    checkMatch,
    isGameFinished,
    calculateScore
  } = useMemoryGame(difficulty);

  // Обновление состояния из gameState
  useEffect(() => {
    if (gameState) {
      setCards(gameState.cards || []);
      setGameStatus(gameState.status || 'waiting');
      setPlayers(gameState.players || []);
      setCurrentPlayer(gameState.currentPlayer || '');
      setMoves(gameState.moves || 0);
      setDifficulty(gameState.difficulty || 'medium');
      
      if (gameState.gameStartTime) {
        setGameStartTime(gameState.gameStartTime);
      }
    }
  }, [gameState]);

  // Инициализация карт при старте игры
  useEffect(() => {
    if (gameStatus === 'playing' && cards.length === 0) {
      const newCards = initializeCards();
      setCards(newCards);
      setGameStartTime(Date.now());
    }
  }, [gameStatus, cards.length, initializeCards]);

  // Таймер игры
  useEffect(() => {
    if (gameStatus === 'playing' && gameStartTime > 0) {
      const timer = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStatus, gameStartTime]);

  // Проверка завершения игры
  useEffect(() => {
    if (cards.length > 0 && isGameFinished(cards)) {
      setGameStatus('finished');
      
      const userPlayer = players.find(p => p.id === userId);
      const finalScore = calculateScore(moves, timeElapsed, userPlayer?.matches || 0);
      
      if (onGameEnd) {
        onGameEnd({
          score: finalScore,
          moves,
          timeElapsed,
          matches: userPlayer?.matches || 0,
          players
        });
      }
    }
  }, [cards, isGameFinished, players, userId, moves, timeElapsed, calculateScore, onGameEnd]);

  // Обработка клика по карте
  const handleCardClick = useCallback((cardIndex: number) => {
    if (gameStatus !== 'playing') return;
    if (currentPlayer !== userId) return;
    if (flippedCards.length >= 2) return;
    
    const card = cards[cardIndex];
    if (!card || card.isFlipped || card.isMatched) return;

    const newFlippedCards = [...flippedCards, cardIndex];
    setFlippedCards(newFlippedCards);

    // Обновляем состояние карты
    const updatedCards = cards.map((c, index) => 
      index === cardIndex ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);

    // Если открыты 2 карты, проверяем совпадение
    if (newFlippedCards.length === 2) {
      const [firstIndex, secondIndex] = newFlippedCards;
      const firstCard = updatedCards[firstIndex];
      const secondCard = updatedCards[secondIndex];

      setTimeout(() => {
        const isMatch = checkMatch(firstCard, secondCard);
        
        if (isMatch) {
          // Совпадение найдено
          const matchedCards = updatedCards.map((c, index) => 
            (index === firstIndex || index === secondIndex) 
              ? { ...c, isMatched: true }
              : c
          );
          setCards(matchedCards);
          
          // Увеличиваем счет игрока
          const updatedPlayers = players.map(p => 
            p.id === userId 
              ? { ...p, matches: p.matches + 1, score: p.score + calculateScore(1, timeElapsed, p.matches + 1) }
              : p
          );
          setPlayers(updatedPlayers);
        } else {
          // Карты не совпадают, переворачиваем обратно
          const flippedBackCards = updatedCards.map((c, index) => 
            (index === firstIndex || index === secondIndex) 
              ? { ...c, isFlipped: false }
              : c
          );
          setCards(flippedBackCards);
        }

        // Увеличиваем количество ходов
        const newMoves = moves + 1;
        setMoves(newMoves);
        
        // Отправляем ход на сервер
        makeMove({
          type: 'flip_cards',
          cardIndices: newFlippedCards,
          isMatch,
          moves: newMoves,
          playerId: userId
        });

        // Сбрасываем открытые карты
        setFlippedCards([]);
        
        // Переход хода к следующему игроку (для мультиплеера)
        if (players.length > 1 && !isMatch) {
          const currentPlayerIndex = players.findIndex(p => p.id === currentPlayer);
          const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
          setCurrentPlayer(players[nextPlayerIndex].id);
        }
      }, 1000);
    }
  }, [
    gameStatus, 
    currentPlayer, 
    userId, 
    flippedCards, 
    cards, 
    moves, 
    players, 
    timeElapsed,
    checkMatch, 
    calculateScore, 
    makeMove
  ]);

  // Новая игра
  const handleNewGame = useCallback(() => {
    const newCards = initializeCards();
    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setTimeElapsed(0);
    setGameStartTime(Date.now());
    setGameStatus('playing');
    
    // Сброс статистики игроков
    const resetPlayers = players.map(p => ({ ...p, score: 0, matches: 0, moves: 0 }));
    setPlayers(resetPlayers);
    
    sendMessage({ type: 'new_game', difficulty });
  }, [initializeCards, players, difficulty, sendMessage]);

  // Смена сложности
  const handleDifficultyChange = useCallback((newDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(newDifficulty);
    sendMessage({ type: 'change_difficulty', difficulty: newDifficulty });
  }, [sendMessage]);

  // Возврат в лобби
  const handleReturnToLobby = useCallback(() => {
    if (onReturnToLobby) {
      onReturnToLobby();
    }
  }, [onReturnToLobby]);

  // Мемоизированные данные
  const userPlayer = useMemo(() => 
    players.find(p => p.id === userId), [players, userId]);

  const isUserTurn = useMemo(() => 
    currentPlayer === userId, [currentPlayer, userId]);

  const gameProgress = useMemo(() => {
    const totalPairs = cards.length / 2;
    const matchedPairs = cards.filter(c => c.isMatched).length / 2;
    return totalPairs > 0 ? (matchedPairs / totalPairs) * 100 : 0;
  }, [cards]);

  const sortedPlayers = useMemo(() => 
    [...players].sort((a, b) => b.score - a.score), [players]);

  // Условные состояния после всех хуков
  if (error) {
    return (
      <div className={`${styles.error} ${className || ''}`}>
        <h3>Ошибка подключения</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Попробовать снова</button>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`${styles.loading} ${className || ''}`}>
        <h3>Подключение к игре...</h3>
      </div>
    );
  }

  return (
    <div className={`${styles.memoryModule} ${className || ''}`}>
      {/* Заглушка для Мемори */}
      <div className={styles.memoryPlaceholder}>
        <h2>Игра "Мемори"</h2>
        <p>Модуль игры на память в разработке. Здесь будет реализована карточная игра.</p>
        <div className={styles.gameInfo}>
          <p>Сложность: {difficulty}</p>
          <p>Игроки: {players.length}</p>
          <p>Статус: {gameStatus}</p>
          <p>Ходов: {moves}</p>
          <p>Время: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</p>
        </div>
        <div className={styles.controls}>
          <button onClick={handleNewGame} className={styles.newGameButton}>
            Новая игра
          </button>
          <button onClick={handleReturnToLobby} className={styles.returnButton}>
            Вернуться в лобби
          </button>
        </div>
      </div>
    </div>
  );
};
