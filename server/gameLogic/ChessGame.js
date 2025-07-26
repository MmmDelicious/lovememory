// server/gameLogic/ChessGame.js
const { Chess } = require('chess.js');

class ChessGame {
  constructor(players) {
    this.players = players; // [player1_id (white), player2_id (black)]
    this.game = new Chess();
    this.winner = null;
    this.isDraw = false;
    this.gameType = 'chess';
    console.log(`[ChessGame] New game created. White: ${this.players[0]}, Black: ${this.players[1]}`);
  }

  getCurrentPlayerId() {
    if (this.game.isGameOver()) {
      return null;
    }
    return this.game.turn() === 'w' ? this.players[0] : this.players[1];
  }

  getState() {
    // Возвращаем состояние в упрощенном виде
    return {
      gameType: this.gameType,
      status: this.status,
      players: this.players,
      currentPlayerId: this.getCurrentPlayerId(),
      winner: this.winner,
      isDraw: this.isDraw,
      board: this.board,
      turn: this.turn
    };
  }

  // Очистка ресурсов при удалении игры
  cleanup() {
    // Для шахмат особой очистки не требуется
    console.log(`[CHESS] Game cleanup completed`);
  }

  makeMove(playerId, move) {
    console.log(`[ChessGame] Attempting move by player ${playerId} with data:`, move);

    if (this.game.isGameOver()) {
      const msg = 'Game is already over';
      console.error(`[ChessGame] [ERROR] ${msg}`);
      throw new Error(msg);
    }

    const playerIndex = this.players.indexOf(playerId);
    if (playerIndex === -1) {
        const msg = 'Player not in this game';
        console.error(`[ChessGame] [ERROR] ${msg}`);
        throw new Error(msg);
    }
    const playerColor = playerIndex === 0 ? 'w' : 'b';
    console.log(`[ChessGame] Player ${playerId} is color ${playerColor}.`);

    if (this.game.turn() !== playerColor) {
      const msg = `Not your turn. Current turn is ${this.game.turn()}`;
      console.error(`[ChessGame] [ERROR] ${msg}`);
      throw new Error('Not your turn');
    }

    console.log(`[ChessGame] Passing move to chess.js:`, move);
    const result = this.game.move(move);
    
    if (result === null) {
      const msg = 'Invalid move';
      console.error(`[ChessGame] [ERROR] ${msg}. chess.js rejected the move.`);
      throw new Error(msg);
    }

    console.log('[ChessGame] Move successful.');

    if (this.game.isGameOver()) {
      console.log('[ChessGame] Game is now over.');
      if (this.game.isCheckmate()) {
        this.winner = playerId;
        console.log(`[ChessGame] Checkmate. Winner is ${this.winner}`);
      } else {
        this.winner = 'draw';
        this.isDraw = true;
        console.log('[ChessGame] Draw.');
      }
    }

    return this.getState();
  }
}

module.exports = ChessGame;