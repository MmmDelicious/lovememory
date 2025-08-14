const TicTacToeGame = require('./TicTacToeGame');
const ChessGame = require('./ChessGame');
const PokerGame = require('./PokerGame');
const QuizGame = require('./QuizGame');
const WordleGame = require('./WordleGame');

class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame(roomId, gameType, players, options = {}) {
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
        // Для шахмат нужны только ID игроков в правильном порядке
        const chessPlayers = players.map(player => player.id || player);
        // Убеждаемся, что первый игрок - белые, второй - черные
        console.log(`[GameManager] Creating chess game with players:`, chessPlayers);
        gameInstance = new ChessGame(chessPlayers);
        break;
      case 'poker':
        console.log('[GameManager] Creating poker game with players:', players);
        // Определяем блайнды пропорционально бай-ину (5% и 10% от бай-ина)
        const buyInCoins = players[0]?.buyInCoins || 100;
        const smallBlind = Math.max(1, Math.floor(buyInCoins * 0.05)); // 5% от бай-ина, минимум 1
        const bigBlind = Math.max(2, Math.floor(buyInCoins * 0.1));   // 10% от бай-ина, минимум 2
        const blinds = { small: smallBlind, big: bigBlind };
        
        console.log(`[GameManager] Setting blinds: ${blinds.small}/${blinds.big} for buyIn: ${buyInCoins} coins`);
        gameInstance = new PokerGame(players, blinds, options);
        console.log('[GameManager] Poker game created successfully');
        break;
      case 'quiz':
        // Для квиза нужны только ID игроков
        const quizPlayers = players.map(player => player.id || player);
        gameInstance = new QuizGame(quizPlayers);
        break;
      case 'wordle':
        const wordlePlayers = players.map(player => player.id || player);
        gameInstance = new WordleGame(wordlePlayers, options);
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