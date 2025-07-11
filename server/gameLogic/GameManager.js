const TicTacToeGame = require('./TicTacToeGame');
const ChessGame = require('./ChessGame');

class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame(roomId, gameType, players) {
    if (this.games.has(roomId)) {
      return this.games.get(roomId);
    }

    let gameInstance;
    switch (gameType) {
      case 'tic-tac-toe':
        gameInstance = new TicTacToeGame(players);
        break;
      case 'chess':
        gameInstance = new ChessGame(players);
        break;
      default:
        throw new Error(`Unsupported game type: ${gameType}`);
    }

    this.games.set(roomId, gameInstance);
    return gameInstance;
  }

  getGame(roomId) {
    return this.games.get(roomId);
  }

  removeGame(roomId) {
    this.games.delete(roomId);
  }
}

module.exports = new GameManager();