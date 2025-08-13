/**
 * @fileoverview Утилиты для валидации игровых данных на клиенте
 */

import type { Card, ValidationResult } from '../types/game.types';

/**
 * Валидация хода в крестиках-ноликах
 */
export const validateTicTacToeMove = (moveIndex: number): boolean => {
  return Number.isInteger(moveIndex) && moveIndex >= 0 && moveIndex <= 8;
};

/**
 * Валидация шахматного хода
 */
export const validateChessMove = (move: any): boolean => {
  if (!move || typeof move !== 'object') return false;
  if (!move.from || !move.to) return false;
  
  const squareRegex = /^[a-h][1-8]$/;
  return squareRegex.test(move.from) && squareRegex.test(move.to);
};

/**
 * Валидация покерного хода
 */
export const validatePokerMove = (move: any): boolean => {
  if (!move || typeof move !== 'object') return false;
  
  const validActions = ['fold', 'check', 'call', 'raise', 'bet'];
  if (!validActions.includes(move.action)) return false;
  
  // Для raise и bet требуется положительное значение
  if (['raise', 'bet'].includes(move.action)) {
    return Number.isInteger(move.value) && move.value > 0;
  }
  
  return true;
};

/**
 * Валидация ответа в квизе
 */
export const validateQuizAnswer = (answerIndex: number): boolean => {
  return Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex <= 3;
};

/**
 * Валидация карты
 */
export const validateCard = (card: Card): boolean => {
  if (!card || typeof card !== 'object') return false;
  
  const validRanks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const validSuits = ['H', 'D', 'C', 'S'];
  
  return validRanks.includes(card.rank) && validSuits.includes(card.suit);
};

/**
 * Валидация данных комнаты
 */
export const validateRoomData = (roomData: any): ValidationResult => {
  const errors: string[] = [];
  
  if (!roomData.gameType) {
    errors.push('Тип игры обязателен');
  }
  
  if (!roomData.bet || roomData.bet <= 0) {
    errors.push('Ставка должна быть положительным числом');
  }
  
  if (roomData.bet && roomData.bet < 10) {
    errors.push('Минимальная ставка: 10 монет');
  }
  
  if (roomData.bet && roomData.bet > 2000) {
    errors.push('Максимальная ставка: 2000 монет');
  }
  
  if (roomData.maxPlayers && (roomData.maxPlayers < 2 || roomData.maxPlayers > 10)) {
    errors.push('Количество игроков должно быть от 2 до 10');
  }
  
  // Специфичная валидация для покера
  if (roomData.gameType === 'poker') {
    const validTableTypes = ['standard', 'premium', 'elite'];
    if (roomData.tableType && !validTableTypes.includes(roomData.tableType)) {
      errors.push('Неверный тип стола для покера');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Санитизация пользовательского ввода
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Удаляем потенциально опасные символы
    .substring(0, 1000); // Ограничиваем длину
};

/**
 * Форматирование времени для отображения
 */
export const formatGameTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Проверка, является ли ход валидным для текущего состояния игры
 */
export const isValidMoveForGameState = (gameState: any, move: any, playerId: string): boolean => {
  if (!gameState || gameState.status !== 'in_progress') return false;
  if (gameState.currentPlayerId !== playerId) return false;
  
  switch (gameState.gameType) {
    case 'tic-tac-toe':
      return validateTicTacToeMove(move) && gameState.board[move] === null;
    case 'chess':
      return validateChessMove(move);
    case 'poker':
      return validatePokerMove(move);
    case 'quiz':
      return validateQuizAnswer(move);
    default:
      return false;
  }
};

/**
 * Получение дружелюбного сообщения об ошибке
 */
export const getFriendlyErrorMessage = (error: string): string => {
  const errorMap: Record<string, string> = {
    'Not your turn': 'Сейчас не ваш ход',
    'Game is already over': 'Игра уже завершена',
    'Invalid move': 'Недопустимый ход',
    'Cell is already taken': 'Эта клетка уже занята',
    'Invalid move position': 'Неверная позиция хода',
    'Time is up': 'Время истекло',
    'Insufficient coins': 'Недостаточно монет',
    'Room is full': 'Комната заполнена',
    'Player not found': 'Игрок не найден'
  };
  
  return errorMap[error] || error;
};