"use strict";
// Временно отключаем импорты игр для совместимости
// import { IGame, IGameState, IPlayer, GAME_TYPES_INFO } from '../types/game.interfaces';
// import { TicTacToeGameNew } from './games/TicTacToeGameNew';
// import { MemoryGameNew } from './games/MemoryGameNew';
// import { ChessGameNew } from './games/ChessGameNew';
// import { QuizGameNew } from './games/QuizGameNew';
// import { WordleGameNew } from './games/WordleGameNew';
// import { CodenamesGameNew } from './games/CodenamesGameNew';
// import { PokerGameNew } from './games/PokerGameNew';
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
        // Временно возвращаем true для всех типов игр
        return ['tic-tac-toe', 'memory', 'chess', 'quiz', 'wordle', 'codenames', 'poker'].includes(gameType);
    }
    /**
     * Получает информацию о типе игры
     */
    getGameTypeInfo(gameType) {
        // Временно возвращаем базовую информацию
        return {
            name: gameType,
            maxPlayers: 2,
            description: `${gameType} game`
        };
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
    // Методы создания новых игр (TypeScript) - временно отключены
    _createTicTacToeGame(roomId, players, options) {
        // Временно возвращаем заглушку
        console.log(`[GameManager] TicTacToe game creation disabled for room ${roomId}`);
        return {
            gameType: 'tic-tac-toe',
            status: 'waiting',
            players: players,
            getState: () => ({ gameType: 'tic-tac-toe', status: 'waiting' }),
            cleanup: () => { }
        };
    }
    _createMemoryGameNew(roomId, players, options) {
        // Временно возвращаем заглушку
        console.log(`[GameManager] Memory game creation disabled for room ${roomId}`);
        return {
            gameType: 'memory',
            status: 'waiting',
            players: players,
            getState: () => ({ gameType: 'memory', status: 'waiting' }),
            cleanup: () => { }
        };
    }
    _createChessGameNew(roomId, players, options) {
        // Временно возвращаем заглушку
        console.log(`[GameManager] Chess game creation disabled for room ${roomId}`);
        return {
            gameType: 'chess',
            status: 'waiting',
            players: players,
            getState: () => ({ gameType: 'chess', status: 'waiting' }),
            cleanup: () => { }
        };
    }
    _createQuizGameNew(roomId, players, options) {
        // Временно возвращаем заглушку
        console.log(`[GameManager] Quiz game creation disabled for room ${roomId}`);
        return {
            gameType: 'quiz',
            status: 'waiting',
            players: players,
            getState: () => ({ gameType: 'quiz', status: 'waiting' }),
            cleanup: () => { }
        };
    }
    _createWordleGameNew(roomId, players, options) {
        // Временно возвращаем заглушку
        console.log(`[GameManager] Wordle game creation disabled for room ${roomId}`);
        return {
            gameType: 'wordle',
            status: 'waiting',
            players: players,
            getState: () => ({ gameType: 'wordle', status: 'waiting' }),
            cleanup: () => { }
        };
    }
    _createCodenamesGameNew(roomId, players, options) {
        // Временно возвращаем заглушку
        console.log(`[GameManager] Codenames game creation disabled for room ${roomId}`);
        return {
            gameType: 'codenames',
            status: 'waiting',
            players: players,
            getState: () => ({ gameType: 'codenames', status: 'waiting' }),
            cleanup: () => { }
        };
    }
    _createPokerGameNew(roomId, players, options) {
        // Временно возвращаем заглушку
        console.log(`[GameManager] Poker game creation disabled for room ${roomId}`);
        return {
            gameType: 'poker',
            status: 'waiting',
            players: players,
            getState: () => ({ gameType: 'poker', status: 'waiting' }),
            cleanup: () => { }
        };
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
// Экспортируем singleton instance
module.exports = new GameManagerNew();
//# sourceMappingURL=GameManagerNew.js.map