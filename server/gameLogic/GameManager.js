const TicTacToeGame = require('./TicTacToeGame');
const ChessGame = require('./ChessGame');
const PokerGame = require('./PokerGame');
const QuizGame = require('./QuizGame');

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
        // Для крестиков-ноликов нужны только ID игроков
        const ticTacToePlayers = players.map(player => player.id || player);
        gameInstance = new TicTacToeGame(ticTacToePlayers);
        break;
      case 'chess':
        // Для шахмат нужны только ID игроков
        const chessPlayers = players.map(player => player.id || player);
        gameInstance = new ChessGame(chessPlayers);
        break;
      case 'poker':
        const initialStacks = {};
        const playerObjects = players.map((player) => {
          const playerId = player.id || player;
          const playerName = player.name || player;
          initialStacks[playerId] = 1000;
          return { id: playerId, name: playerName };
        });
        gameInstance = new PokerGame(playerObjects, initialStacks);
        break;
      case 'quiz':
        // Для квиза нужны только ID игроков
        const quizPlayers = players.map(player => player.id || player);
        gameInstance = new QuizGame(quizPlayers);
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
    const game = this.games.get(roomId);
    if (game && typeof game.cleanup === 'function') {
      // Очищаем ресурсы игры (например, таймеры для квиза)
      game.cleanup();
    }
    this.games.delete(roomId);
  }
}

module.exports = new GameManager();