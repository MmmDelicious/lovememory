/**
 * @fileoverview Утилиты для валидации игровых данных
 */

/**
 * Валидация хода в крестиках-ноликах
 * @param {number} moveIndex - Индекс клетки (0-8)
 * @returns {boolean}
 */
function validateTicTacToeMove(moveIndex) {
    return Number.isInteger(moveIndex) && moveIndex >= 0 && moveIndex <= 8;
  }
  
  /**
   * Валидация шахматного хода
   * @param {Object} move - Объект хода
   * @param {string} move.from - Откуда ход
   * @param {string} move.to - Куда ход
   * @returns {boolean}
   */
  function validateChessMove(move) {
    if (!move || typeof move !== 'object') return false;
    if (!move.from || !move.to) return false;
    
    const squareRegex = /^[a-h][1-8]$/;
    return squareRegex.test(move.from) && squareRegex.test(move.to);
  }
  
  /**
   * Валидация покерного хода
   * @param {Object} move - Объект хода
   * @param {string} move.action - Действие
   * @param {number} [move.value] - Значение для ставок
   * @returns {boolean}
   */
  function validatePokerMove(move) {
    if (!move || typeof move !== 'object') return false;
    
    const validActions = ['fold', 'check', 'call', 'raise', 'bet'];
    if (!validActions.includes(move.action)) return false;
    
    // Для raise и bet требуется положительное значение
    if (['raise', 'bet'].includes(move.action)) {
      return Number.isInteger(move.value) && move.value > 0;
    }
    
    return true;
  }
  
  /**
   * Валидация ответа в квизе
   * @param {number} answerIndex - Индекс ответа
   * @returns {boolean}
   */
  function validateQuizAnswer(answerIndex) {
    return Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex <= 3;
  }
  
  /**
   * Валидация данных комнаты
   * @param {Object} roomData - Данные комнаты
   * @returns {Object} Результат валидации
   */
  function validateRoomData(roomData) {
    const errors = [];
    
    if (!roomData.gameType) {
      errors.push('Game type is required');
    }
    
    if (!roomData.bet || roomData.bet <= 0) {
      errors.push('Bet must be a positive number');
    }
    
    if (roomData.maxPlayers && (roomData.maxPlayers < 2 || roomData.maxPlayers > 10)) {
      errors.push('Max players must be between 2 and 10');
    }
    
    // Специфичная валидация для покера
    if (roomData.gameType === 'poker') {
      const validTableTypes = ['standard', 'premium', 'elite'];
      if (roomData.tableType && !validTableTypes.includes(roomData.tableType)) {
        errors.push('Invalid table type for poker');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Санитизация пользовательского ввода
   * @param {string} input - Входная строка
   * @returns {string} Очищенная строка
   */
  function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Удаляем потенциально опасные символы
      .substring(0, 1000); // Ограничиваем длину
  }
  
  module.exports = {
    validateTicTacToeMove,
    validateChessMove,
    validatePokerMove,
    validateQuizAnswer,
    validateRoomData,
    sanitizeInput
  };