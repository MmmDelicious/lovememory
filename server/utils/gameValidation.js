// Game validation utilities

/**
 * Tic-tac-toe move validation
 * @param {number} moveIndex - Cell index (0-8)
 * @returns {boolean}
 */
function validateTicTacToeMove(moveIndex) {
    return Number.isInteger(moveIndex) && moveIndex >= 0 && moveIndex <= 8;
  }
  
  /**
 * Chess move validation
 * @param {Object} move - Move object
 * @param {string} move.from - Move from
 * @param {string} move.to - Move to
 * @returns {boolean}
 */
  function validateChessMove(move) {
    if (!move || typeof move !== 'object') return false;
    if (!move.from || !move.to) return false;
    
    const squareRegex = /^[a-h][1-8]$/;
    return squareRegex.test(move.from) && squareRegex.test(move.to);
  }
  
  /**
 * Poker move validation
 * @param {Object} move - Move object
 * @param {string} move.action - Action
 * @param {number} [move.value] - Value for bets
 * @returns {boolean}
 */
  function validatePokerMove(move) {
    if (!move || typeof move !== 'object') return false;
    
    const validActions = ['fold', 'check', 'call', 'raise', 'bet'];
    if (!validActions.includes(move.action)) return false;
    
    // For raise and bet, positive value is required
    if (['raise', 'bet'].includes(move.action)) {
      return Number.isInteger(move.value) && move.value > 0;
    }
    
    return true;
  }
  
  /**
 * Quiz answer validation
 * @param {number} answerIndex - Answer index
 * @returns {boolean}
 */
  function validateQuizAnswer(answerIndex) {
    return Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex <= 3;
  }
  
  /**
 * Room data validation
 * @param {Object} roomData - Room data
 * @returns {Object} Validation result
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
    
    // Poker-specific validation
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
 * User input sanitization
 * @param {string} input - Input string
 * @returns {string} Cleaned string
 */
  function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potentially dangerous characters
      .substring(0, 1000); // Limit length
  }
  
  module.exports = {
    validateTicTacToeMove,
    validateChessMove,
    validatePokerMove,
    validateQuizAnswer,
    validateRoomData,
    sanitizeInput
  };