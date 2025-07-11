const { Chess } = require('chess.js');

class ChessGame {
  constructor(players) {
    this.players = players; // [player1_id (white), player2_id (black)]
    this.game = new Chess();
    this.winner = null;
    this.isDraw = false;
    this.gameType = 'chess'; // Для идентификации на клиенте
  }

  getCurrentPlayerId() {
    if (this.game.isGameOver()) {
      return null;
    }
    // Игрок с индексом 0 - белые, с индексом 1 - черные
    return this.game.turn() === 'w' ? this.players[0] : this.players[1];
  }

  getState() {
    const isGameOver = this.game.isGameOver();
    return {
      // --- Стандартные поля состояния ---
      gameType: this.gameType,
      status: isGameOver ? 'finished' : 'in_progress',
      players: this.players,
      currentPlayerId: this.getCurrentPlayerId(),
      winner: this.winner,
      isDraw: this.isDraw,
      
      // --- Специфичные поля для шахмат ---
      board: this.game.fen(), // FEN-нотация для позиции
      turn: this.game.turn(), // 'w' или 'b'
      isCheckmate: this.game.isCheckmate(),
      isStalemate: this.game.isStalemate(),
    };
  }

  makeMove(playerId, move) {
    const playerIndex = this.players.indexOf(playerId);
    if (playerIndex === -1) {
        throw new Error('Player not in this game');
    }
    const playerColor = playerIndex === 0 ? 'w' : 'b';

    if (this.game.turn() !== playerColor) {
      throw new Error('Not your turn');
    }

    const result = this.game.move(move);
    if (result === null) {
      throw new Error('Invalid move');
    }

    if (this.game.isGameOver()) {
      if (this.game.isCheckmate()) {
        this.winner = playerId;
      } else { // Ничья, пат и т.д.
        this.winner = 'draw';
        this.isDraw = true;
      }
    }

    return this.getState();
  }
}

module.exports = ChessGame;