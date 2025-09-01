"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManagerNew = void 0;
const game_interfaces_1 = require("../types/game.interfaces");
// Импортируем новые игры 
const TicTacToeGameNew_1 = require("./games/TicTacToeGameNew");
const MemoryGameNew_1 = require("./games/MemoryGameNew");
const ChessGameNew_1 = require("./games/ChessGameNew");
// import { QuizGameNew } from './games/QuizGameNew'; // Временно отключено
// import { WordleGameNew } from './games/WordleGameNew'; // Временно отключено
const CodenamesGameNew_1 = require("./games/CodenamesGameNew");
const PokerGameFactory_1 = require("./poker/PokerGameFactory");
/**
 * Обновленный GameManager с поддержкой новой архитектуры
 * Постепенно мигрирует игры на TypeScript классы
 */
class GameManagerNew {
    constructor() {
        this.games = new Map(); // any для совместимости со старыми играми
        this.gameInstances = new Map(); // Кэш экземпляров для производительности
    }
    /**
     * Создает новую игру указанного типа
     */
    createGame(roomId, gameType, players, options = {}) {
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
        let gameInstance;
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
        }
        catch (error) {
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
    getGame(roomId) {
        return this.games.get(roomId) || null;
    }
    /**
     * Удаляет игру и очищает ресурсы
     */
    removeGame(roomId) {
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
            }
            catch (error) {
                console.error(`[GameManager] Error removing game for room ${roomId}:`, error);
                return false;
            }
        }
        return false;
    }
    /**
     * Получает список всех активных игр
     */
    getActiveGames() {
        const activeGames = [];
        for (const [roomId, game] of this.games.entries()) {
            try {
                const state = game.getState ? game.getState() : game.getGameState?.() || {};
                activeGames.push({
                    roomId,
                    gameType: state.gameType || 'unknown',
                    status: state.status || 'unknown'
                });
            }
            catch (error) {
                console.error(`[GameManager] Error getting state for room ${roomId}:`, error);
            }
        }
        return activeGames;
    }
    /**
     * Получает статистику по играм
     */
    getGameStats() {
        const stats = {};
        for (const game of this.games.values()) {
            try {
                const state = game.getState ? game.getState() : game.getGameState?.() || {};
                const gameType = state.gameType || 'unknown';
                stats[gameType] = (stats[gameType] || 0) + 1;
            }
            catch (error) {
                console.error(`[GameManager] Error getting game stats:`, error);
            }
        }
        return stats;
    }
    /**
     * Проверяет, поддерживается ли тип игры
     */
    isGameTypeSupported(gameType) {
        return Object.keys(game_interfaces_1.GAME_TYPES_INFO).includes(gameType);
    }
    /**
     * Получает информацию о типе игры
     */
    getGameTypeInfo(gameType) {
        return game_interfaces_1.GAME_TYPES_INFO[gameType] || null;
    }
    /**
     * Приватный метод для создания экземпляра игры
     */
    _createGameInstance(roomId, gameType, players, options) {
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
    _createTicTacToeGame(roomId, players, options) {
        const game = new TicTacToeGameNew_1.TicTacToeGameNew(roomId, {
            timeLimit: options.timeLimit || 30,
            difficulty: options.difficulty || 'medium'
        });
        // Добавляем игроков
        for (const player of players) {
            const playerData = {
                id: player.id || player,
                name: player.name || player.email || player.id || player,
                email: player.email,
                avatar: player.avatar,
                ready: true
            };
            game.addPlayer(playerData);
        }
        // Настраиваем колбэки для уведомлений
        game.onStateChange = (state) => {
            if (options.onStateChange) {
                options.onStateChange(state);
            }
        };
        return game;
    }
    _createMemoryGameNew(roomId, players, options) {
        const game = new MemoryGameNew_1.MemoryGameNew(roomId, {
            timeLimit: options.timeLimit || 30,
            difficulty: options.difficulty || 'easy'
        });
        for (const player of players) {
            const playerData = {
                id: player.id || player,
                name: player.name || player.email || player.id || player,
                email: player.email,
                avatar: player.avatar,
                ready: true
            };
            game.addPlayer(playerData);
        }
        game.onStateChange = (state) => {
            if (options.onStateChange) {
                options.onStateChange(state);
            }
        };
        return game;
    }
    _createChessGameNew(roomId, players, options) {
        const game = new ChessGameNew_1.ChessGameNew(roomId, {
            whiteTime: options.whiteTime || 300,
            blackTime: options.blackTime || 300,
            increment: options.increment || 2
        });
        for (const player of players) {
            const playerData = {
                id: player.id || player,
                name: player.name || player.email || player.id || player,
                email: player.email,
                avatar: player.avatar,
                ready: true
            };
            game.addPlayer(playerData);
        }
        game.onStateChange = (state) => {
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
    _createCodenamesGameNew(roomId, players, options) {
        if (players.length !== 4) {
            throw new Error(`Codenames requires exactly 4 players, but got ${players.length}`);
        }
        const game = new CodenamesGameNew_1.CodenamesGameNew(roomId, {
            turnTimeLimit: options.turnTimeLimit || 120,
            difficulty: options.difficulty || 'medium'
        });
        for (const player of players) {
            const playerData = {
                id: player.id || player,
                name: player.name || player.email || player.id || player,
                email: player.email,
                avatar: player.avatar,
                ready: true
            };
            game.addPlayer(playerData);
        }
        game.onStateChange = (state) => {
            if (options.onStateChange) {
                options.onStateChange(state);
            }
        };
        return game;
    }
    _createPokerGameNew(roomId, players, options) {
        console.log(`🃏 [GameManager] Creating poker game via factory`, {
            timestamp: new Date().toISOString(),
            roomId,
            playersData: players,
            optionsKeys: Object.keys(options)
        });
        // Создаем новый покер через фабрику
        const game = PokerGameFactory_1.PokerGameFactory.createGame(roomId, players, options);
        console.log(`🏭 [GameManager] Poker game created by factory`, {
            timestamp: new Date().toISOString(),
            roomId,
            gameType: game.gameType,
            status: game.status,
            playersCount: game.players?.length || 0
        });
        // Настраиваем callback состояния
        game.onStateChange = (state) => {
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
        game.onGameEvent = (event) => {
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
    isValidMove(roomId, playerId, move) {
        const game = this.getGame(roomId);
        if (!game)
            return false;
        try {
            if (game.isValidMove) {
                return game.isValidMove(playerId, move);
            }
            // Fallback для старых игр
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Получает доступные ходы для игрока
     */
    getValidMoves(roomId, playerId) {
        const game = this.getGame(roomId);
        if (!game)
            return [];
        try {
            if (game.getValidMoves) {
                return game.getValidMoves(playerId);
            }
            return [];
        }
        catch {
            return [];
        }
    }
    /**
     * Очищает все игры (для тестирования или перезапуска)
     */
    clearAllGames() {
        for (const [roomId] of this.games.entries()) {
            this.removeGame(roomId);
        }
    }
    /**
     * Получает количество активных игр
     */
    getActiveGameCount() {
        return this.games.size;
    }
}
exports.GameManagerNew = GameManagerNew;
// Экспортируем singleton instance
exports.default = new GameManagerNew();
//# sourceMappingURL=GameManagerNew.js.map