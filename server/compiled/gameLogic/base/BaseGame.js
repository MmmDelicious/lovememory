"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseGame = void 0;
/**
 * Абстрактный базовый класс для всех игр
 * Содержит общую логику управления игроками, состоянием и событиями
 */
class BaseGame {
    constructor(roomId, settings) {
        // Основные свойства
        this._players = [];
        this._status = 'waiting';
        this._winner = null;
        this._moveHistory = [];
        this._roomId = roomId;
        this._createdAt = new Date();
        // Настройки по умолчанию (переопределяются в наследниках)
        this.settings = {
            maxPlayers: 2,
            minPlayers: 2,
            timeLimit: 300, // 5 минут
            difficulty: 'medium',
            ...settings
        };
    }
    // Геттеры для защищенных свойств
    get players() {
        return [...this._players];
    }
    get status() {
        return this._status;
    }
    get winner() {
        return this._winner;
    }
    get roomId() {
        return this._roomId;
    }
    get moveHistory() {
        return [...this._moveHistory];
    }
    // Управление игроками
    addPlayer(player) {
        // Проверяем, что игрок еще не добавлен
        if (this._players.find(p => p.id === player.id)) {
            throw new Error(`Player ${player.id} already in game`);
        }
        // Проверяем лимиты
        if (this._players.length >= this.settings.maxPlayers) {
            throw new Error(`Game is full (max ${this.settings.maxPlayers} players)`);
        }
        // Если игра уже идет, добавляем игрока в observer mode
        if (this._status === 'in_progress') {
            const observerPlayer = { ...player, ready: false, isObserver: true };
            this._players.push(observerPlayer);
            this._emitEvent({
                type: 'player_joined_as_observer',
                playerId: player.id,
                data: observerPlayer,
                timestamp: new Date()
            });
            return this.getState();
        }
        // Обычное добавление игрока в ожидающую игру
        this._players.push({ ...player, ready: player.ready ?? false, isObserver: false });
        this._emitEvent({
            type: 'player_joined',
            playerId: player.id,
            data: player,
            timestamp: new Date()
        });
        // Автоматически начинаем игру, если все готовы
        this._checkAutoStart();
        return this.getState();
    }
    removePlayer(playerId) {
        const playerIndex = this._players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            throw new Error(`Player ${playerId} not found`);
        }
        const removedPlayer = this._players[playerIndex];
        this._players.splice(playerIndex, 1);
        this._emitEvent({
            type: 'player_left',
            playerId: playerId,
            data: removedPlayer,
            timestamp: new Date()
        });
        // Обрабатываем особые случаи при удалении игрока
        this._handlePlayerRemoval(playerId);
        return this.getState();
    }
    getPlayer(playerId) {
        return this._players.find(p => p.id === playerId) || null;
    }
    setPlayerReady(playerId, ready = true) {
        const player = this._players.find(p => p.id === playerId);
        if (!player) {
            throw new Error(`Player ${playerId} not found`);
        }
        player.ready = ready;
        this._emitEvent({
            type: 'player_ready_changed',
            playerId: playerId,
            data: { ready },
            timestamp: new Date()
        });
        this._checkAutoStart();
        return this.getState();
    }
    // Управление игрой
    startGame() {
        if (this._status !== 'waiting') {
            throw new Error(`Cannot start game in status: ${this._status}`);
        }
        if (this._players.length < this.settings.minPlayers) {
            throw new Error(`Not enough players (need ${this.settings.minPlayers}, have ${this._players.length})`);
        }
        if (!this._players.every(p => p.ready)) {
            throw new Error('Not all players are ready');
        }
        this._status = 'in_progress';
        this._startedAt = new Date();
        // Инициализируем игру (переопределяется в наследниках)
        this._initializeGame();
        this._emitEvent({
            type: 'game_started',
            data: { startedAt: this._startedAt },
            timestamp: new Date()
        });
        return this.getState();
    }
    isGameFinished() {
        return this._status === 'finished';
    }
    // Защищенные методы для использования в наследниках
    _addMoveToHistory(playerId, move, data) {
        const gameMove = {
            playerId,
            timestamp: new Date(),
            data: { move, ...data }
        };
        this._moveHistory.push(gameMove);
        this._lastMoveAt = gameMove.timestamp;
    }
    _finishGame(winner) {
        if (this._status !== 'in_progress') {
            return;
        }
        this._status = 'finished';
        this._winner = winner;
        this._finishedAt = new Date();
        this._emitEvent({
            type: 'game_finished',
            data: {
                winner,
                finishedAt: this._finishedAt,
                duration: this._finishedAt.getTime() - (this._startedAt?.getTime() || 0)
            },
            timestamp: new Date()
        });
    }
    _emitEvent(event) {
        if (this.onGameEvent) {
            this.onGameEvent(event);
        }
    }
    _emitStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.getState());
        }
    }
    _getBaseState() {
        return {
            roomId: this._roomId,
            gameType: this.gameType,
            status: this._status,
            players: this.players,
            winner: this._winner,
            createdAt: this._createdAt,
            startedAt: this._startedAt,
            finishedAt: this._finishedAt,
            lastMoveAt: this._lastMoveAt
        };
    }
    // Методы для переопределения в наследниках
    _initializeGame() {
        // Базовая инициализация - переопределяется в наследниках
    }
    _handlePlayerRemoval(playerId) {
        // Если осталось слишком мало игроков
        if (this._players.length < this.settings.minPlayers && this._status === 'in_progress') {
            this._finishGame(null); // Игра прерывается
        }
    }
    _checkAutoStart() {
        if (this._status === 'waiting' &&
            this._players.length >= this.settings.minPlayers &&
            this._players.every(p => p.ready)) {
            this.startGame();
        }
    }
    // Очистка ресурсов
    cleanup() {
        this.onStateChange = undefined;
        this.onGameEvent = undefined;
        // Дополнительная очистка в наследниках
        this._onCleanup();
    }
    _onCleanup() {
        // Переопределяется в наследниках для специфичной очистки
    }
    // Утилитарные методы
    _getCurrentTimestamp() {
        return new Date();
    }
    _isPlayerInGame(playerId) {
        return this._players.some(p => p.id === playerId);
    }
    _validatePlayerMove(playerId) {
        if (this._status !== 'in_progress') {
            throw new Error('Game is not in progress');
        }
        if (!this._isPlayerInGame(playerId)) {
            throw new Error('Player not in game');
        }
    }
}
exports.BaseGame = BaseGame;
//# sourceMappingURL=BaseGame.js.map