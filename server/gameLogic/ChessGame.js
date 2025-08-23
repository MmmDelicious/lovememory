const { Chess } = require('chess.js');
class ChessGame {
  constructor(players) {
    this.players = players; // [player1_id (white), player2_id (black)]
    this.game = new Chess();
    this.winner = null;
    this.isDraw = false;
    this.gameType = 'chess';
    this.status = 'in_progress';
    this.moveHistory = [];
    this.whiteTime = 180; // 3 минуты
    this.blackTime = 180; // 3 минуты
    this.increment = 2;   // 2 секунды
    if (this.game.turn() !== 'w') {
      console.error('[ChessGame] Error: White should move first!');
    }
  }
  getCurrentPlayerId() {
    if (this.game.isGameOver()) {
      return null;
    }
    return this.game.turn() === 'w' ? this.players[0] : this.players[1];
  }
  getValidMoves(square) {
    try {
      const moves = this.game.moves({ square: square, verbose: true });
      return moves.map(move => move.to);
    } catch (error) {
      console.error(`[ChessGame] Error getting valid moves for square ${square}:`, error);
      return [];
    }
  }
  getState() {
    const board = {};
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    ranks.forEach(rank => {
      files.forEach(file => {
        const square = `${file}${rank}`;
        const piece = this.game.get(square);
        if (piece) {
          board[square] = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
        }
      });
    });
    const state = {
      gameType: this.gameType,
      status: this.status,
      players: this.players,
      currentPlayerId: this.getCurrentPlayerId(),
      winner: this.winner,
      isDraw: this.isDraw,
      board: board,
      turn: this.game.turn(),
      moveHistory: this.moveHistory,
      fen: this.game.fen(),
      whiteTime: this.whiteTime,
      blackTime: this.blackTime,
    };
    return state;
  }
  cleanup() {
  }
  makeMove(playerId, move) {
    if (this.game.isGameOver()) {
      throw new Error('Game is already over');
    }
    const playerIndex = this.players.indexOf(playerId);
    if (playerIndex === -1) {
      throw new Error('Player not in this game');
    }
    const playerColor = playerIndex === 0 ? 'w' : 'b';
    if (this.game.turn() !== playerColor) {
      throw new Error('Not your turn');
    }
    const fromSquare = move.from;
    const piece = this.game.get(fromSquare);
    if (!piece || piece.color !== playerColor) {
      throw new Error('Cannot move opponent\'s piece or empty square');
    }
    if (playerColor === 'w') {
      this.whiteTime += this.increment;
    } else {
      this.blackTime += this.increment;
    }
    const result = this.game.move(move);
    if (result === null) {
      if (playerColor === 'w') {
        this.whiteTime -= this.increment;
      } else {
        this.blackTime -= this.increment;
      }
      throw new Error('Invalid move');
    }
    this.moveHistory.push(result.san);
    if (this.game.isGameOver()) {
      this.status = 'finished';
      if (this.game.isCheckmate()) {
        this.winner = playerId;
      } else {
        this.winner = 'draw';
        this.isDraw = true;
      }
    }
    return this.getState();
  }
}
module.exports = ChessGame;
