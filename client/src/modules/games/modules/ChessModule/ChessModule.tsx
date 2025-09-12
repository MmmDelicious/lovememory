import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { ChessBoard, ChessPlayerInfo, ChessGameControls } from '../../../../components/games';
import { useGameSocket } from '../../hooks/useGameSocket';
import styles from './ChessModule.module.css';

interface ChessModuleProps {
  gameId: string;
  userId: string;
  onGameEnd?: (result: any) => void;
  onReturnToLobby?: () => void;
  className?: string;
}

/**
 * Модуль шахматной игры - самостоятельный модуль со своей бизнес-логикой
 * Отвечает за: логику шахмат, состояние игры, валидацию ходов, таймер
 * Использует компоненты из слоя Components для отображения
 */
export const ChessModule: React.FC<ChessModuleProps> = ({
  gameId,
  userId,
  onGameEnd,
  onReturnToLobby,
  className
}) => {
  // Состояние модуля
  const [board, setBoard] = useState<string[][]>([]);
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [gameStatus, setGameStatus] = useState<'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw'>('playing');
  const [players, setPlayers] = useState<any[]>([]);
  const [moveHistory, setMoveHistory] = useState<any[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{ white: string[], black: string[] }>({ white: [], black: [] });
  const [timeLeft, setTimeLeft] = useState<{ white: number, black: number }>({ white: 600, black: 600 });
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);

  // Игровой сокет
  const { gameState, makeMove, sendMessage, isConnected, error } = useGameSocket({
    gameId,
    userId,
    gameType: 'chess'
  });

  // Инициализация доски
  const initializeBoard = useCallback(() => {
    const initialBoard = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    setBoard(initialBoard);
  }, []);

  // Обновление состояния из gameState
  useEffect(() => {
    if (gameState) {
      setBoard(gameState.board || []);
      setCurrentPlayer(gameState.currentPlayer || 'white');
      setGameStatus(gameState.status || 'playing');
      setPlayers(gameState.players || []);
      setMoveHistory(gameState.moveHistory || []);
      setCapturedPieces(gameState.capturedPieces || { white: [], black: [] });
      setTimeLeft(gameState.timeLeft || { white: 600, black: 600 });
      
      // Проверяем, чей ход
      const currentUserId = gameState.players?.find(p => p.color === gameState.currentPlayer)?.id;
      setIsPlayerTurn(currentUserId === userId);
    }
  }, [gameState, userId]);

  // Инициализация
  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  // Таймер
  useEffect(() => {
    if (gameStatus === 'playing' && isPlayerTurn) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = { ...prev };
          if (currentPlayer === 'white') {
            newTime.white = Math.max(0, newTime.white - 1);
          } else {
            newTime.black = Math.max(0, newTime.black - 1);
          }
          
          // Проверка окончания времени
          if (newTime.white === 0 || newTime.black === 0) {
            setGameStatus('checkmate');
            if (onGameEnd) {
              onGameEnd({
                winner: newTime.white === 0 ? 'black' : 'white',
                reason: 'timeout'
              });
            }
          }
          
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStatus, isPlayerTurn, currentPlayer, onGameEnd]);

  // Валидация ходов (упрощенная)
  const getValidMoves = useCallback((row: number, col: number): [number, number][] => {
    const piece = board[row]?.[col];
    if (!piece || piece === '.') return [];
    
    // Здесь должна быть полная логика валидации ходов для каждой фигуры
    // Пока возвращаем простую логику для демонстрации
    const moves: [number, number][] = [];
    
    // Простая логика для пешек
    if (piece.toLowerCase() === 'p') {
      const direction = piece === 'P' ? -1 : 1;
      const newRow = row + direction;
      
      if (newRow >= 0 && newRow < 8) {
        if (board[newRow][col] === '.') {
          moves.push([newRow, col]);
          
          // Двойной ход с начальной позиции
          if ((piece === 'P' && row === 6) || (piece === 'p' && row === 1)) {
            if (board[newRow + direction]?.[col] === '.') {
              moves.push([newRow + direction, col]);
            }
          }
        }
        
        // Взятие по диагонали
        if (col > 0 && board[newRow][col - 1] !== '.' && 
            isOpponentPiece(piece, board[newRow][col - 1])) {
          moves.push([newRow, col - 1]);
        }
        if (col < 7 && board[newRow][col + 1] !== '.' && 
            isOpponentPiece(piece, board[newRow][col + 1])) {
          moves.push([newRow, col + 1]);
        }
      }
    }
    
    return moves;
  }, [board]);

  const isOpponentPiece = (piece1: string, piece2: string): boolean => {
    if (piece1 === '.' || piece2 === '.') return false;
    return (piece1 === piece1.toUpperCase()) !== (piece2 === piece2.toUpperCase());
  };

  // Обработчики событий
  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!isPlayerTurn || gameStatus !== 'playing') return;

    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare;
      
      // Проверяем, можно ли сделать ход
      const isValidMove = validMoves.some(([r, c]) => r === row && c === col);
      
      if (isValidMove) {
        // Делаем ход
        const move = {
          from: { row: selectedRow, col: selectedCol },
          to: { row, col },
          piece: board[selectedRow][selectedCol],
          captured: board[row][col] !== '.' ? board[row][col] : null,
          timestamp: Date.now()
        };
        
        makeMove(move);
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // Выбираем новую фигуру
        const piece = board[row][col];
        if (piece !== '.' && canSelectPiece(piece)) {
          setSelectedSquare([row, col]);
          setValidMoves(getValidMoves(row, col));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      // Выбираем фигуру
      const piece = board[row][col];
      if (piece !== '.' && canSelectPiece(piece)) {
        setSelectedSquare([row, col]);
        setValidMoves(getValidMoves(row, col));
      }
    }
  }, [selectedSquare, validMoves, isPlayerTurn, gameStatus, board, makeMove, getValidMoves]);

  const canSelectPiece = (piece: string): boolean => {
    if (piece === '.') return false;
    const isWhitePiece = piece === piece.toUpperCase();
    const userColor = players.find(p => p.id === userId)?.color;
    return (userColor === 'white' && isWhitePiece) || (userColor === 'black' && !isWhitePiece);
  };

  const handleOfferDraw = useCallback(() => {
    sendMessage({ type: 'offer_draw' });
  }, [sendMessage]);

  const handleResign = useCallback(() => {
    sendMessage({ type: 'resign' });
    if (onGameEnd) {
      onGameEnd({
        winner: currentPlayer === 'white' ? 'black' : 'white',
        reason: 'resignation'
      });
    }
  }, [sendMessage, onGameEnd, currentPlayer]);

  const handleReturnToLobby = useCallback(() => {
    if (onReturnToLobby) {
      onReturnToLobby();
    }
  }, [onReturnToLobby]);

  // Мемоизированные данные для компонентов
  const whitePlayer = useMemo(() => 
    players.find(p => p.color === 'white'), [players]);
  const blackPlayer = useMemo(() => 
    players.find(p => p.color === 'black'), [players]);

  const currentPlayerInfo = useMemo(() => 
    players.find(p => p.id === userId), [players, userId]);

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
    <div className={`${styles.chessModule} ${className || ''}`}>
      {/* Заглушка для шахмат */}
      <div className={styles.chessPlaceholder}>
        <h2>Шахматная игра</h2>
        <p>Модуль шахмат в разработке. Здесь будет реализована полная игра в шахматы.</p>
        <div className={styles.gameInfo}>
          <p>Игроки: {players.length}</p>
          <p>Текущий ход: {currentPlayer}</p>
          <p>Статус: {gameStatus}</p>
        </div>
        <button onClick={handleReturnToLobby} className={styles.returnButton}>
          Вернуться в лобби
        </button>
      </div>
    </div>
  );
};
