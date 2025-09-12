import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TicTacToeBoard, GameHeader, GameResult } from '../../../../components/games';
import { useGameSocket } from '../../hooks/useGameSocket';
import styles from './TicTacToeModule.module.css';

interface TicTacToeModuleProps {
  gameId: string;
  userId: string;
  onGameEnd?: (result: any) => void;
  onReturnToLobby?: () => void;
  className?: string;
}

type CellValue = 'X' | 'O' | null;
type GameStatus = 'waiting' | 'playing' | 'finished';
type Player = {
  id: string;
  name: string;
  symbol: 'X' | 'O';
  score: number;
};

/**
 * Модуль игры "Крестики-нолики" - самостоятельный модуль со своей бизнес-логикой
 * Отвечает за: логику игры, состояние доски, проверку победы, смену игроков
 * Использует компоненты из слоя Components для отображения
 */
export const TicTacToeModule: React.FC<TicTacToeModuleProps> = ({
  gameId,
  userId,
  onGameEnd,
  onReturnToLobby,
  className
}) => {
  // Состояние модуля
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);

  // Игровой сокет
  const { gameState, makeMove, sendMessage, isConnected, error } = useGameSocket({
    gameId,
    userId,
    gameType: 'tic-tac-toe'
  });

  // Обновление состояния из gameState
  useEffect(() => {
    if (gameState) {
      setBoard(gameState.board || Array(9).fill(null));
      setCurrentPlayer(gameState.currentPlayer || 'X');
      setGameStatus(gameState.status || 'waiting');
      setPlayers(gameState.players || []);
      setWinner(gameState.winner || null);
      setWinningLine(gameState.winningLine || []);
      setMoves(gameState.moves || 0);
    }
  }, [gameState]);

  // Проверка победных комбинаций
  const checkWinner = useCallback((board: CellValue[]): { winner: 'X' | 'O' | 'draw' | null, line: number[] } => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // горизонтали
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // вертикали  
      [0, 4, 8], [2, 4, 6] // диагонали
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }

    // Проверка на ничью
    if (board.every(cell => cell !== null)) {
      return { winner: 'draw', line: [] };
    }

    return { winner: null, line: [] };
  }, []);

  // Обработка хода
  const handleCellClick = useCallback((index: number) => {
    if (board[index] || winner || gameStatus !== 'playing') return;

    const currentUserPlayer = players.find(p => p.id === userId);
    if (!currentUserPlayer || currentUserPlayer.symbol !== currentPlayer) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;

    const result = checkWinner(newBoard);
    
    const moveData = {
      index,
      player: currentPlayer,
      board: newBoard,
      moves: moves + 1,
      winner: result.winner,
      winningLine: result.line
    };

    makeMove(moveData);

    // Локальное обновление для быстрого отклика
    setBoard(newBoard);
    setMoves(prev => prev + 1);
    
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.line);
      setGameStatus('finished');
      
      if (onGameEnd) {
        onGameEnd({
          winner: result.winner,
          players,
          moves: moves + 1
        });
      }
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  }, [board, winner, gameStatus, players, userId, currentPlayer, moves, checkWinner, makeMove, onGameEnd]);

  // Новая игра
  const handleNewGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine([]);
    setMoves(0);
    setGameStatus('playing');
    
    sendMessage({ type: 'new_game' });
  }, [sendMessage]);

  // Возврат в лобби
  const handleReturnToLobby = useCallback(() => {
    if (onReturnToLobby) {
      onReturnToLobby();
    }
  }, [onReturnToLobby]);

  // Мемоизированные данные
  const currentPlayerInfo = useMemo(() => 
    players.find(p => p.symbol === currentPlayer), [players, currentPlayer]);

  const userPlayer = useMemo(() => 
    players.find(p => p.id === userId), [players, userId]);

  const isUserTurn = useMemo(() => 
    userPlayer?.symbol === currentPlayer, [userPlayer, currentPlayer]);

  const gameTitle = useMemo(() => {
    if (gameStatus === 'waiting') return 'Ожидание игроков...';
    if (gameStatus === 'finished') {
      if (winner === 'draw') return 'Ничья!';
      if (winner && userPlayer?.symbol === winner) return 'Вы победили!';
      if (winner) return 'Вы проиграли!';
    }
    return isUserTurn ? 'Ваш ход' : `Ход игрока ${currentPlayerInfo?.name || currentPlayer}`;
  }, [gameStatus, winner, userPlayer, isUserTurn, currentPlayerInfo]);

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
    <div className={`${styles.ticTacToeModule} ${className || ''}`}>
      {/* Заголовок игры */}
      <GameHeader
        title="Крестики-нолики"
        subtitle={gameTitle}
        players={players}
        currentPlayer={currentPlayer}
        moves={moves}
        onReturnToLobby={handleReturnToLobby}
      />

      {/* Игровая доска */}
      <div className={styles.gameBoard}>
        <TicTacToeBoard
          board={board}
          onCellClick={handleCellClick}
          winningLine={winningLine}
          disabled={!isUserTurn || gameStatus !== 'playing'}
        />
      </div>

      {/* Результат игры */}
      {gameStatus === 'finished' && (
        <GameResult
          winner={winner}
          players={players}
          userPlayer={userPlayer}
          moves={moves}
          onNewGame={handleNewGame}
          onReturnToLobby={handleReturnToLobby}
        />
      )}

      {/* Информация о игроках */}
      <div className={styles.playersInfo}>
        {players.map(player => (
          <div 
            key={player.id} 
            className={`${styles.playerCard} ${
              player.symbol === currentPlayer ? styles.active : ''
            } ${player.id === userId ? styles.currentUser : ''}`}
          >
            <div className={styles.playerSymbol}>{player.symbol}</div>
            <div className={styles.playerDetails}>
              <div className={styles.playerName}>
                {player.name} {player.id === userId && '(Вы)'}
              </div>
              <div className={styles.playerScore}>Побед: {player.score}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
