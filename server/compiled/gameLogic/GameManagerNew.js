"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManagerNew = void 0;
const game_interfaces_1 = require("../types/game.interfaces");
// Импортируем новые игры 
const TicTacToeGameNew_1 = require("./games/TicTacToeGameNew");
const MemoryGameNew_1 = require("./games/MemoryGameNew");
const ChessGameNew_1 = require("./games/ChessGameNew");
// import { QuizGameNew } from './games/QuizGameNew';
// import { WordleGameNew } from './games/WordleGameNew';
const CodenamesGameNew_1 = require("./games/CodenamesGameNew");
// import { PokerGameNew } from './games/PokerGameNew';
/**
 * Обновленный GameManager с поддержкой новой архитектуры
 * Постепенно мигрирует игры на TypeScript классы
 */
class GameManagerNew {
    constructor() {
        this.games = new Map(); // any для совместимости со старыми играми
        this.gameInstances = new Map(); // Кэш экземпляров для производительности
        this.onStateChange = (state) => {
            if (options.onStateChange) {
                options.onStateChange(state);
            }
        };
    }
    /**
     * Создает новую игру указанного типа
     */
    createGame(roomId, gameType, players, options = {}) {
        // Проверяем, что игра уже не создана
        if (this.games.has(roomId)) {
            return this.games.get(roomId);
        }
        let gameInstance;
        try {
            // Создаем игру в зависимости от типа
            gameInstance = this._createGameInstance(roomId, gameType, players, options);
            // Сохраняем в кэше
            this.games.set(roomId, gameInstance);
            return gameInstance;
        }
        catch (error) {
            console.error(`[GameManager] Error creating ${gameType} game:`, error);
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
    _createQuizGameNew(roomId, players, options) {
        const gameFormat = options.gameFormat || (players.length === 4 ? '2v2' : '1v1');
        throw new Error('Quiz game is temporarily disabled');
        // const game = new QuizGameNew(roomId, {
        gameFormat: gameFormat,
            totalQuestions;
        options.totalQuestions || 10,
            questionTimeLimit;
        options.questionTimeLimit || 15;
    }
    ;
    for(, player, of, players) {
        const playerData = {
            id: player.id || player,
            name: player.name || player.email || player.id || player,
            email: player.email,
            avatar: player.avatar,
            ready: true
        };
        game.addPlayer(playerData);
    }
}
exports.GameManagerNew = GameManagerNew;
return game;
_createWordleGameNew(roomId, string, players, any[], options, any);
any;
{
    const gameFormat = options.gameFormat || (players.length === 4 ? '2v2' : '1v1');
    const requiredPlayers = gameFormat === '2v2' ? 4 : 2;
    throw new Error('Wordle game is temporarily disabled');
    // const game = new WordleGameNew(roomId, {
    gameFormat: gameFormat,
        language;
    options.language || 'russian',
        maxRounds;
    options.rounds || 3,
        maxAttempts;
    options.maxAttempts || 6;
}
;
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
// Настраиваем callback для изменения состояния
game.onStateChange = (state) => {
    if (options.onStateChange) {
        options.onStateChange(state);
    }
};
// Автоматически стартуем игру если достаточно игроков
if (players.length >= requiredPlayers) {
    game.startGame();
}
return game;
_createCodenamesGameNew(roomId, string, players, any[], options, any);
CodenamesGameNew_1.CodenamesGameNew;
{
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
_createPokerGameNew(roomId, string, players, any[], options, any);
any;
{
    // Получаем buy-in из первого игрока или используем дефолтное значение
    const buyInCoins = players[0]?.buyInCoins || 1000;
    const smallBlind = Math.max(1, Math.floor(buyInCoins * 0.005)); // 0.5% от buy-in
    const bigBlind = Math.max(2, Math.floor(buyInCoins * 0.01)); // 1% от buy-in
    throw new Error('Poker game is temporarily disabled');
    // const game = new PokerGameNew(roomId, {
    smallBlind,
        bigBlind,
        buyInAmount;
    buyInCoins,
        turnTimeLimit;
    options.turnTimeLimit || 30000;
}
;
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
// Настраиваем callback состояния
game.onStateChange = (state) => {
    if (options.onStateChange) {
        options.onStateChange(state);
    }
};
return game;
isValidMove(roomId, string, playerId, string, move, any);
boolean;
{
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
getValidMoves(roomId, string, playerId, string);
any[];
{
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
clearAllGames();
void {
    : .games.entries()
};
{
    this.removeGame(roomId);
}
getActiveGameCount();
number;
{
    return this.games.size;
}
// Экспортируем singleton instance
exports.default = new GameManagerNew();
//# sourceMappingURL=GameManagerNew.js.map