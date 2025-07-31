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
        console.log('[GameManager] Creating poker game with players:', players);
        // Определяем блайнды на основе бай-ина
        let blinds = { small: 5, big: 10 }; // Дефолт для 100 монет
        const buyInCoins = players[0]?.buyInCoins || 100;
        if (buyInCoins >= 250) {
          blinds = { small: 25, big: 50 }; // Для 250+ монет
        }
        if (buyInCoins >= 1000) {
          blinds = { small: 100, big: 200 }; // Для 1000+ монет  
        }
        
        console.log(`[GameManager] Setting blinds: ${blinds.small}/${blinds.big} for buyIn: ${buyInCoins} coins`);
        gameInstance = new PokerGame(players, blinds);
        console.log('[GameManager] Poker game created successfully');
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