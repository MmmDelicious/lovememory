const TicTacToeGame = require('./TicTacToeGame');
const ChessGame = require('./ChessGame');
const { PokerGame } = require('./PokerGame');
const QuizGame = require('./QuizGame');
const WordleGame = require('./WordleGame');
const CodenamesGame = require('./CodenamesGame');
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
        const ticTacToePlayers = players.map(player => player.id || player);
        gameInstance = new TicTacToeGame(ticTacToePlayers);
        break;
      case 'chess':
        const chessPlayers = players.map(player => player.id || player);
        console.log(`[GameManager] Creating chess game with players:`, chessPlayers);
        gameInstance = new ChessGame(chessPlayers);
        break;
      case 'poker':
        console.log('[GameManager] Creating poker game with players:', players);
        const buyInCoins = players[0]?.buyInCoins || 100;
        const smallBlind = Math.max(1, Math.floor(buyInCoins * 0.05)); // 5% от бай-ина, минимум 1
        const bigBlind = Math.max(2, Math.floor(buyInCoins * 0.1));   // 10% от бай-ина, минимум 2
        const blinds = { small: smallBlind, big: bigBlind };
        console.log(`[GameManager] Setting blinds: ${blinds.small}/${blinds.big} for buyIn: ${buyInCoins} coins`);
        gameInstance = new PokerGame(players, blinds, options);
        console.log('[GameManager] Poker game created successfully');
        break;
      case 'quiz':
        const quizPlayers = players.map(player => player.id || player);
        const quizSettings = {
          gameFormat: options.gameFormat || '1v1',
          totalQuestions: options.totalQuestions || 10
        };
        gameInstance = new QuizGame(quizPlayers, quizSettings);
        break;
      case 'wordle':
        const wordleSettings = {
          language: options.language || 'russian',
          rounds: options.rounds || 3,
          gameFormat: options.gameFormat || '1v1',
          onStateChange: options.onStateChange
        };
        gameInstance = new WordleGame(roomId, wordleSettings, options.onStateChange);
        for (const player of players) {
          const playerId = player.id || player;
          const playerName = player.name || player.email || playerId;
          gameInstance.addPlayer(playerId, playerName);
        }
        const requiredPlayers = wordleSettings.gameFormat === '2v2' ? 4 : 2;
        if (players.length >= requiredPlayers) {
          gameInstance.startGame();
        }
        break;
      case 'codenames':
        if (players.length !== 4) {
          console.error(`[GameManager] Codenames requires exactly 4 players, got ${players.length}`);
          throw new Error(`Codenames requires exactly 4 players, but got ${players.length}`);
        }
        console.log(`[GameManager] Creating Codenames game with players:`, players.map(p => ({ id: p.id, name: p.name })));
        const codenamesSettings = {
          gameFormat: '2v2',
          ...options
        };
        gameInstance = new CodenamesGame(players, codenamesSettings);
        console.log('[GameManager] Codenames game created successfully');
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
      game.cleanup();
    }
    this.games.delete(roomId);
  }
}
module.exports = new GameManager();
