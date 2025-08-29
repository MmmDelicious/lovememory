import { IGame, IGameState, IPlayer, GAME_TYPES_INFO } from '../types/game.interfaces';

// Импортируем новые игры 
import { TicTacToeGameNew } from './games/TicTacToeGameNew';
import { MemoryGameNew } from './games/MemoryGameNew';
import { ChessGameNew } from './games/ChessGameNew';
import { QuizGameNew } from './games/QuizGameNew';
import { WordleGameNew } from './games/WordleGameNew';
import { CodenamesGameNew } from './games/CodenamesGameNew';
import { PokerGameNew } from './games/PokerGameNew';

/**
 * Обновленный GameManager с поддержкой новой архитектуры
 * Постепенно мигрирует игры на TypeScript классы
 */
export class GameManagerNew {
  private games = new Map<string, IGame | any>(); // any для совместимости со старыми играми
  private gameInstances = new Map<string, any>(); // Кэш экземпляров для производительности
  
  /**
   * Создает новую игру указанного типа
   */
  public createGame(
    roomId: string, 
    gameType: string, 
    players: any[], 
    options: any = {}
  ): IGame | any {
    // Проверяем, что игра уже не создана
    if (this.games.has(roomId)) {
      return this.games.get(roomId);
    }
    
    let gameInstance: IGame | any;
    
    try {
      // Создаем игру в зависимости от типа
      gameInstance = this._createGameInstance(roomId, gameType, players, options);
      
      // Сохраняем в кэше
      this.games.set(roomId, gameInstance);
      
      return gameInstance;
      
    } catch (error) {
      console.error(`[GameManager] Error creating ${gameType} game:`, error);
      throw error;
    }
  }
  
  /**
   * Получает существующую игру
   */
  public getGame(roomId: string): IGame | any | null {
    return this.games.get(roomId) || null;
  }
  
  /**
   * Удаляет игру и очищает ресурсы
   */
  public removeGame(roomId: string): boolean {
    const game = this.games.get(roomId);
    
    if (game) {
      try {
        // Очищаем ресурсы игры
        if (typeof game.cleanup === 'function') {
          game.cleanup();
        }
        
        this.games.delete(roomId);
        this.gameInstances.delete(roomId);
        
        return true;
        
      } catch (error) {
        console.error(`[GameManager] Error removing game for room ${roomId}:`, error);
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Получает список всех активных игр
   */
  public getActiveGames(): Array<{ roomId: string, gameType: string, status: string }> {
    const activeGames: Array<{ roomId: string, gameType: string, status: string }> = [];
    
    for (const [roomId, game] of this.games.entries()) {
      try {
        const state = game.getState ? game.getState() : game.getGameState?.() || {};
        activeGames.push({
          roomId,
          gameType: state.gameType || 'unknown',
          status: state.status || 'unknown'
        });
      } catch (error) {
        console.error(`[GameManager] Error getting state for room ${roomId}:`, error);
      }
    }
    
    return activeGames;
  }
  
  /**
   * Получает статистику по играм
   */
  public getGameStats(): { [gameType: string]: number } {
    const stats: { [gameType: string]: number } = {};
    
    for (const game of this.games.values()) {
      try {
        const state = game.getState ? game.getState() : game.getGameState?.() || {};
        const gameType = state.gameType || 'unknown';
        stats[gameType] = (stats[gameType] || 0) + 1;
      } catch (error) {
        console.error(`[GameManager] Error getting game stats:`, error);
      }
    }
    
    return stats;
  }
  
  /**
   * Проверяет, поддерживается ли тип игры
   */
  public isGameTypeSupported(gameType: string): boolean {
    return Object.keys(GAME_TYPES_INFO).includes(gameType);
  }
  
  /**
   * Получает информацию о типе игры
   */
  public getGameTypeInfo(gameType: string) {
    return GAME_TYPES_INFO[gameType] || null;
  }
  
  /**
   * Приватный метод для создания экземпляра игры
   */
  private _createGameInstance(
    roomId: string, 
    gameType: string, 
    players: any[], 
    options: any
  ): IGame | any {
    
    switch (gameType) {
      // Новые игры на TypeScript
      case 'tic-tac-toe':
        return this._createTicTacToeGame(roomId, players, options);
      
      case 'memory':
        return this._createMemoryGameNew(roomId, players, options);
      
      case 'chess':
        return this._createChessGameNew(roomId, players, options);
      
      case 'quiz':
        return this._createQuizGameNew(roomId, players, options);
      
      case 'wordle':
        return this._createWordleGameNew(roomId, players, options);
      
      case 'codenames':
        return this._createCodenamesGameNew(roomId, players, options);
      
      // Старые игры (оставляем как есть)
      case 'poker':
        return this._createPokerGameNew(roomId, players, options);
      
      default:
        throw new Error(`Unsupported game type: ${gameType}`);
    }
  }
  
  // Методы создания новых игр (TypeScript)
  private _createTicTacToeGame(roomId: string, players: any[], options: any): TicTacToeGameNew {
    const game = new TicTacToeGameNew(roomId, {
      timeLimit: options.timeLimit || 30,
      difficulty: options.difficulty || 'medium'
    });
    
    // Добавляем игроков
    for (const player of players) {
      const playerData: IPlayer = {
        id: player.id || player,
        name: player.name || player.email || player.id || player,
        email: player.email,
        avatar: player.avatar,
        ready: true
      };
      
      game.addPlayer(playerData);
    }
    
    // Настраиваем колбэки для уведомлений
    game.onStateChange = (state: IGameState) => {
      if (options.onStateChange) {
        options.onStateChange(state);
      }
    };
    
    return game;
  }
  
  private _createMemoryGameNew(roomId: string, players: any[], options: any): MemoryGameNew {
    const game = new MemoryGameNew(roomId, {
      timeLimit: options.timeLimit || 30,
      difficulty: options.difficulty || 'easy'
    });
    
    for (const player of players) {
      const playerData: IPlayer = {
        id: player.id || player,
        name: player.name || player.email || player.id || player,
        email: player.email,
        avatar: player.avatar,
        ready: true
      };
      
      game.addPlayer(playerData);
    }
    
    game.onStateChange = (state: IGameState) => {
      if (options.onStateChange) {
        options.onStateChange(state);
      }
    };
    
    return game;
  }
  
  private _createChessGameNew(roomId: string, players: any[], options: any): ChessGameNew {
    const game = new ChessGameNew(roomId, {
      whiteTime: options.whiteTime || 300,
      blackTime: options.blackTime || 300,
      increment: options.increment || 2
    });
    
    for (const player of players) {
      const playerData: IPlayer = {
        id: player.id || player,
        name: player.name || player.email || player.id || player,
        email: player.email,
        avatar: player.avatar,
        ready: true
      };

      game.addPlayer(playerData);
    }
    
    game.onStateChange = (state: IGameState) => {
      if (options.onStateChange) {
        options.onStateChange(state);
      }
    };
    
    return game;
  }
  
  private _createQuizGameNew(roomId: string, players: any[], options: any): QuizGameNew {
    const gameFormat = options.gameFormat || (players.length === 4 ? '2v2' : '1v1');
    
    const game = new QuizGameNew(roomId, {
      gameFormat: gameFormat,
      totalQuestions: options.totalQuestions || 10,
      questionTimeLimit: options.questionTimeLimit || 15
    });
    
    for (const player of players) {
      const playerData: IPlayer = {
        id: player.id || player,
        name: player.name || player.email || player.id || player,
        email: player.email,
        avatar: player.avatar,
        ready: true
      };
      
      game.addPlayer(playerData);
    }
    
    game.onStateChange = (state: IGameState) => {
      if (options.onStateChange) {
        options.onStateChange(state);
      }
    };
    
    return game;
  }
  
  private _createWordleGameNew(roomId: string, players: any[], options: any): WordleGameNew {
    const gameFormat = options.gameFormat || (players.length === 4 ? '2v2' : '1v1');
    const requiredPlayers = gameFormat === '2v2' ? 4 : 2;
    
    const game = new WordleGameNew(roomId, {
      gameFormat: gameFormat,
      language: options.language || 'russian',
      maxRounds: options.rounds || 3,
      maxAttempts: options.maxAttempts || 6
    });
    
    for (const player of players) {
      const playerData: IPlayer = {
        id: player.id || player,
        name: player.name || player.email || player.id || player,
        email: player.email,
        avatar: player.avatar,
        ready: true
      };
      
      game.addPlayer(playerData);
    }
    
    // Настраиваем callback для изменения состояния
    game.onStateChange = (state: IGameState) => {
      if (options.onStateChange) {
        options.onStateChange(state);
      }
    };
    
    // Автоматически стартуем игру если достаточно игроков
    if (players.length >= requiredPlayers) {
      game.startGame();
    }
    
    return game;
  }
  
  private _createCodenamesGameNew(roomId: string, players: any[], options: any): CodenamesGameNew {
    if (players.length !== 4) {
      throw new Error(`Codenames requires exactly 4 players, but got ${players.length}`);
    }
    
    const game = new CodenamesGameNew(roomId, {
      turnTimeLimit: options.turnTimeLimit || 120,
      difficulty: options.difficulty || 'medium'
    });
    
    for (const player of players) {
      const playerData: IPlayer = {
        id: player.id || player,
        name: player.name || player.email || player.id || player,
        email: player.email,
        avatar: player.avatar,
        ready: true
      };
      
      game.addPlayer(playerData);
    }
    
    game.onStateChange = (state: IGameState) => {
      if (options.onStateChange) {
        options.onStateChange(state);
      }
    };
    
    return game;
  }
  
  private _createPokerGameNew(roomId: string, players: any[], options: any): PokerGameNew {
    // Получаем buy-in из первого игрока или используем дефолтное значение
    const buyInCoins = players[0]?.buyInCoins || 1000;
    const smallBlind = Math.max(1, Math.floor(buyInCoins * 0.005)); // 0.5% от buy-in
    const bigBlind = Math.max(2, Math.floor(buyInCoins * 0.01));   // 1% от buy-in
    
    const game = new PokerGameNew(roomId, {
      smallBlind,
      bigBlind,
      buyInAmount: buyInCoins,
      turnTimeLimit: options.turnTimeLimit || 30000
    });
    
    // Добавляем игроков
    for (const player of players) {
      const playerData: IPlayer = {
        id: player.id || player,
        name: player.name || player.email || player.id || player,
        email: player.email,
        avatar: player.avatar,
        ready: true
      };
      
      game.addPlayer(playerData);
    }
    
    // Настраиваем callback состояния
    game.onStateChange = (state: any) => {
      if (options.onStateChange) {
        options.onStateChange(state);
      }
    };
    
    return game;
  }
  
  /**
   * Утилитарные методы
   */
  
  /**
   * Проверяет валидность хода для игры
   */
  public isValidMove(roomId: string, playerId: string, move: any): boolean {
    const game = this.getGame(roomId);
    if (!game) return false;
    
    try {
      if (game.isValidMove) {
        return game.isValidMove(playerId, move);
      }
      
      // Fallback для старых игр
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Получает доступные ходы для игрока
   */
  public getValidMoves(roomId: string, playerId: string): any[] {
    const game = this.getGame(roomId);
    if (!game) return [];
    
    try {
      if (game.getValidMoves) {
        return game.getValidMoves(playerId);
      }
      
      return [];
    } catch {
      return [];
    }
  }
  
  /**
   * Очищает все игры (для тестирования или перезапуска)
   */
  public clearAllGames(): void {
    for (const [roomId] of this.games.entries()) {
      this.removeGame(roomId);
    }
  }
  
  /**
   * Получает количество активных игр
   */
  public getActiveGameCount(): number {
    return this.games.size;
  }
}

// Экспортируем singleton instance
export default new GameManagerNew();
