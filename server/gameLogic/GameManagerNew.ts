import { IGame, IGameState, IPlayer, GAME_TYPES_INFO } from '../types/game.interfaces';

// Импортируем новые игры 
import { TicTacToeGameNew } from './games/TicTacToeGameNew';
import { MemoryGameNew } from './games/MemoryGameNew';
import { ChessGameNew } from './games/ChessGameNew';
// import { QuizGameNew } from './games/QuizGameNew'; // Временно отключено
// import { WordleGameNew } from './games/WordleGameNew'; // Временно отключено
import { CodenamesGameNew } from './games/CodenamesGameNew';
import { PokerGameFactory } from './poker/PokerGameFactory';

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
    console.log(`🎮 [GameManager] Creating game instance`, {
      timestamp: new Date().toISOString(),
      roomId,
      gameType,
      playersCount: players.length,
      players: players.map(p => ({ id: p.id, name: p.name })),
      options: Object.keys(options)
    });

    // Проверяем, что игра уже не создана
    if (this.games.has(roomId)) {
      console.log(`♻️  [GameManager] Game already exists, returning existing`, {
        timestamp: new Date().toISOString(),
        roomId,
        gameType
      });
      return this.games.get(roomId);
    }
    
    let gameInstance: IGame | any;
    
    try {
      // Создаем игру в зависимости от типа
      gameInstance = this._createGameInstance(roomId, gameType, players, options);
      
      console.log(`✅ [GameManager] Game instance created successfully`, {
        timestamp: new Date().toISOString(),
        roomId,
        gameType,
        instanceType: gameInstance.constructor.name,
        status: gameInstance.status,
        playersInGame: gameInstance.players?.length || 0
      });
      
      // Сохраняем в кэше
      this.games.set(roomId, gameInstance);
      
      console.log(`💾 [GameManager] Game stored in cache`, {
        timestamp: new Date().toISOString(),
        roomId,
        totalGamesInCache: this.games.size
      });
      
      return gameInstance;
      
    } catch (error) {
      console.error(`❌ [GameManager] Error creating ${gameType} game:`, {
        timestamp: new Date().toISOString(),
        roomId,
        gameType,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
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
      
      // case 'quiz':
      //   return this._createQuizGameNew(roomId, players, options);
      
      // case 'wordle':
      //   return this._createWordleGameNew(roomId, players, options);
      
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
  
  // private _createQuizGameNew(roomId: string, players: any[], options: any): QuizGameNew {
  //   const gameFormat = options.gameFormat || (players.length === 4 ? '2v2' : '1v1');
  //   
  //   const game = new QuizGameNew(roomId, {
  //     gameFormat: gameFormat,
  //     totalQuestions: options.totalQuestions || 10,
  //     questionTimeLimit: options.questionTimeLimit || 15
  //   });
  //   
  //   for (const player of players) {
  //     const playerData: IPlayer = {
  //       id: player.id || player,
  //       name: player.name || player.email || player.id || player,
  //       email: player.email,
  //       avatar: player.avatar,
  //       ready: true
  //     };
  //     
  //     game.addPlayer(playerData);
  //   }
  //   
  //   game.onStateChange = (state: IGameState) => {
  //     if (options.onStateChange) {
  //       options.onStateChange(state);
  //     }
  //   };
  //   
  //   return game;
  // }
  
  // private _createWordleGameNew(roomId: string, players: any[], options: any): WordleGameNew {
  //   const gameFormat = options.gameFormat || (players.length === 4 ? '2v2' : '1v1');
  //   const requiredPlayers = gameFormat === '2v2' ? 4 : 2;
  //   
  //   const game = new WordleGameNew(roomId, {
  //     gameFormat: gameFormat,
  //     language: options.language || 'russian',
  //     maxRounds: options.rounds || 3,
  //     maxAttempts: options.maxAttempts || 6
  //   });
  //   
  //   for (const player of players) {
  //     const playerData: IPlayer = {
  //       id: player.id || player,
  //       name: player.name || player.email || player.id || player,
  //       email: player.email,
  //       avatar: player.avatar,
  //       ready: true
  //     };
  //     
  //     game.addPlayer(playerData);
  //   }
  //   
  //   // Настраиваем callback для изменения состояния
  //   game.onStateChange = (state: IGameState) => {
  //     if (options.onStateChange) {
  //       options.onStateChange(state);
  //     }
  //   };
  //   
  //   // Автоматически стартуем игру если достаточно игроков
  //   if (players.length >= requiredPlayers) {
  //     game.startGame();
  //   }
  //   
  //   return game;
  // }
  
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
  
  private _createPokerGameNew(roomId: string, players: any[], options: any): any {
    console.log(`🃏 [GameManager] Creating poker game via factory`, {
      timestamp: new Date().toISOString(),
      roomId,
      playersData: players,
      optionsKeys: Object.keys(options)
    });

    // Создаем новый покер через фабрику
    const game = PokerGameFactory.createGame(roomId, players, options);
    
    console.log(`🏭 [GameManager] Poker game created by factory`, {
      timestamp: new Date().toISOString(),
      roomId,
      gameType: game.gameType,
      status: game.status,
      playersCount: game.players?.length || 0
    });
    
    // Настраиваем callback состояния
    game.onStateChange = (state: any) => {
      console.log(`🔄 [GameManager] Poker state changed`, {
        timestamp: new Date().toISOString(),
        roomId,
        stage: state?.stage,
        status: state?.status,
        playersCount: state?.players?.length || 0
      });

      if (options.onStateChange) {
        options.onStateChange(state);
      }
    };
    
    // Настраиваем callback событий
    game.onGameEvent = (event: any) => {
      console.log(`📢 [GameManager] Poker game event`, {
        timestamp: new Date().toISOString(),
        roomId,
        eventType: event.type,
        eventData: event.data
      });
    };
    
    console.log(`✅ [GameManager] Poker game fully configured`, {
      timestamp: new Date().toISOString(),
      roomId,
      hasStateCallback: !!options.onStateChange,
      hasEventCallback: !!game.onGameEvent
    });
    
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
