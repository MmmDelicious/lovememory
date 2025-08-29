"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TurnBasedGame = void 0;
const BaseGame_1 = require("./BaseGame");
/**
 * Абстрактный класс для пошаговых игр
 * Добавляет логику управления ходами и таймерами
 */
class TurnBasedGame extends BaseGame_1.BaseGame {
    constructor() {
        super(...arguments);
        this._currentPlayerIndex = 0;
    }
    // Геттеры
    get currentPlayerId() {
        return this._players[this._currentPlayerIndex]?.id;
    }
    get currentPlayerIndex() {
        return this._currentPlayerIndex;
    }
    get turnStartTime() {
        return this._turnStartTime;
    }
    // Переопределяем базовые методы
    makeMove(playerId, move) {
        this._validatePlayerMove(playerId);
        this._validateTurn(playerId);
        if (!this.isValidMove(playerId, move)) {
            throw new Error('Invalid move');
        }
        // Выполняем ход (реализуется в наследниках)
        const result = this._executeMove(playerId, move);
        // Добавляем в историю
        this._addMoveToHistory(playerId, move);
        // Проверяем окончание игры
        if (this._checkGameEnd()) {
            this._finishGame(this._determineWinner());
        }
        else {
            // Переходим к следующему ходу
            this._nextTurn();
        }
        this._emitStateChange();
        return this.getState();
    }
    // Управление ходами
    _nextTurn() {
        this._stopTurnTimer();
        // Переходим к следующему игроку
        this._currentPlayerIndex = (this._currentPlayerIndex + 1) % this._players.length;
        // Пропускаем неактивных игроков (если есть такая логика)
        while (this._shouldSkipPlayer(this._players[this._currentPlayerIndex])) {
            this._currentPlayerIndex = (this._currentPlayerIndex + 1) % this._players.length;
        }
        this._turnStartTime = new Date();
        this._emitEvent({
            type: 'turn_changed',
            playerId: this.currentPlayerId,
            data: {
                previousPlayer: this._players[(this._currentPlayerIndex - 1 + this._players.length) % this._players.length]?.id,
                currentPlayer: this.currentPlayerId,
                turnStartTime: this._turnStartTime
            },
            timestamp: new Date()
        });
        // Запускаем таймер хода, если настроен
        this._startTurnTimer();
    }
    _shouldSkipPlayer(player) {
        // Переопределяется в наследниках для специфичной логики
        // Например, в покере - если игрок сбросил карты
        return false;
    }
    _validateTurn(playerId) {
        if (this.currentPlayerId !== playerId) {
            throw new Error('Not your turn');
        }
    }
    _startTurnTimer() {
        if (!this.settings.timeLimit)
            return;
        this._turnTimer = setTimeout(() => {
            this._handleTurnTimeout();
        }, this.settings.timeLimit * 1000);
    }
    _stopTurnTimer() {
        if (this._turnTimer) {
            clearTimeout(this._turnTimer);
            this._turnTimer = undefined;
        }
    }
    _handleTurnTimeout() {
        const currentPlayer = this.currentPlayerId;
        if (!currentPlayer)
            return;
        this._emitEvent({
            type: 'turn_timeout',
            playerId: currentPlayer,
            timestamp: new Date()
        });
        // Выполняем действие по умолчанию (переопределяется в наследниках)
        this._handleDefaultMove(currentPlayer);
        // Переходим к следующему ходу
        this._nextTurn();
        this._emitStateChange();
    }
    _handleDefaultMove(playerId) {
        // Переопределяется в наследниках
        // Например, в крестиках-ноликах - пропуск хода
        // В покере - fold
    }
    // Переопределяем инициализацию
    _initializeGame() {
        super._initializeGame();
        // Выбираем начинающего игрока
        this._currentPlayerIndex = this._chooseStartingPlayer();
        this._turnStartTime = new Date();
        this._emitEvent({
            type: 'first_turn',
            playerId: this.currentPlayerId,
            data: { startingPlayer: this.currentPlayerId },
            timestamp: new Date()
        });
        this._startTurnTimer();
    }
    _chooseStartingPlayer() {
        // По умолчанию - случайный игрок
        return Math.floor(Math.random() * this._players.length);
    }
    // Переопределяем очистку
    _onCleanup() {
        super._onCleanup();
        this._stopTurnTimer();
    }
    // Переопределяем удаление игрока
    _handlePlayerRemoval(playerId) {
        super._handlePlayerRemoval(playerId);
        // Если удаленный игрок был текущим, переходим к следующему
        if (this._status === 'in_progress' && this._players.length > 0) {
            // Корректируем индекс текущего игрока
            if (this._currentPlayerIndex >= this._players.length) {
                this._currentPlayerIndex = 0;
            }
            this._turnStartTime = new Date();
            this._startTurnTimer();
        }
    }
    // Переопределяем getState для добавления информации о ходах
    _getTurnBasedState() {
        return {
            ...this._getBaseState(),
            currentPlayerId: this.currentPlayerId || '',
            turnStartTime: this._turnStartTime,
            turnTimeLimit: this.settings.timeLimit,
            moveHistory: this.moveHistory
        };
    }
    // Утилитарные методы
    getRemainingTurnTime() {
        if (!this.settings.timeLimit || !this._turnStartTime) {
            return 0;
        }
        const elapsed = (Date.now() - this._turnStartTime.getTime()) / 1000;
        return Math.max(0, this.settings.timeLimit - elapsed);
    }
    isTurnExpired() {
        return this.getRemainingTurnTime() <= 0;
    }
    getCurrentPlayer() {
        return this.currentPlayerId ? this.getPlayer(this.currentPlayerId) : null;
    }
}
exports.TurnBasedGame = TurnBasedGame;
//# sourceMappingURL=TurnBasedGame.js.map