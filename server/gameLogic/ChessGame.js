// server/gameLogic/ChessGame.js
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
    
    // Убеждаемся, что белые ходят первыми
    if (this.game.turn() !== 'w') {
      console.error('[ChessGame] Error: White should move first!');
    }
    
    console.log(`[ChessGame] New game created. White: ${this.players[0]}, Black: ${this.players[1]}`);
    console.log(`[ChessGame] Initial turn: ${this.game.turn()}`);
    console.log(`[ChessGame] Initial FEN: ${this.game.fen()}`);
  }

  getCurrentPlayerId() {
    if (this.game.isGameOver()) {
      return null;
    }
    const currentPlayerId = this.game.turn() === 'w' ? this.players[0] : this.players[1];
    console.log(`[ChessGame] Current turn: ${this.game.turn()}, current player: ${currentPlayerId}`);
    console.log(`[ChessGame] Players: White=${this.players[0]}, Black=${this.players[1]}`);
    return currentPlayerId;
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
    // Создаем объект доски для фронтенда
    const board = {};
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    ranks.forEach(rank => {
      files.forEach(file => {
        const square = `${file}${rank}`;
        const piece = this.game.get(square);
        if (piece) {
          // В chess.js: белые фигуры = строчные буквы, черные = заглавные
          // Но мы хотим: белые = заглавные, черные = строчные
          if (piece.color === 'w') {
            board[square] = piece.type.toUpperCase(); // Белые фигуры заглавными
          } else {
            board[square] = piece.type.toLowerCase(); // Черные фигуры строчными
          }
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
      fen: this.game.fen()
    };

    console.log(`[ChessGame] State - Turn: ${state.turn}, Current Player: ${state.currentPlayerId}`);
    console.log(`[ChessGame] State - Players: White=${state.players[0]}, Black=${state.players[1]}`);

    return state;
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
    console.log(`[ChessGame] Current turn: ${this.game.turn()}`);

    if (this.game.turn() !== playerColor) {
      const msg = `Not your turn. Current turn is ${this.game.turn()}`;
      console.error(`[ChessGame] [ERROR] ${msg}`);
      throw new Error('Not your turn');
    }

    // Проверяем, что игрок ходит своей фигурой
    const fromSquare = move.from;
    const piece = this.game.get(fromSquare);
    if (!piece) {
      const msg = 'No piece at the specified square';
      console.error(`[ChessGame] [ERROR] ${msg}`);
      throw new Error(msg);
    }
    
    console.log(`[ChessGame] Piece at ${fromSquare}:`, piece);
    
    if (piece.color !== playerColor) {
      const msg = 'Cannot move opponent\'s piece';
      console.error(`[ChessGame] [ERROR] ${msg}`);
      throw new Error(msg);
    }

    console.log(`[ChessGame] Passing move to chess.js:`, move);
    const result = this.game.move(move);
    
    if (result === null) {
      const msg = 'Invalid move';
      console.error(`[ChessGame] [ERROR] ${msg}. chess.js rejected the move.`);
      throw new Error(msg);
    }

    console.log('[ChessGame] Move successful.');
    console.log(`[ChessGame] New turn: ${this.game.turn()}`);
    
    // Добавляем ход в историю
    this.moveHistory.push(result.san);

    if (this.game.isGameOver()) {
      console.log('[ChessGame] Game is now over.');
      this.status = 'finished';
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