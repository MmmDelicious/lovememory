"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGame = void 0;
const BaseGame_1 = require("./BaseGame");
/**
 * Абстрактный класс для игр реального времени
 * Добавляет логику одновременных ходов и глобальных таймеров
 */
class RealtimeGame extends BaseGame_1.BaseGame {
    constructor() {
        super(...arguments);
        this._simultaneousMoves = true;
        this._pendingMoves = new Map();
        this._roundNumber = 1;
    }
    // Геттеры
    get gameStartTime() {
        return this._gameStartTime;
    }
    get timeRemaining() {
        return this._timeRemaining;
    }
    get simultaneousMoves() {
        return this._simultaneousMoves;
    }
    get roundNumber() {
        return this._roundNumber;
    }
    get pendingMoves() {
        return new Map(this._pendingMoves);
    }
    // Переопределяем makeMove для обработки одновременных ходов
    makeMove(playerId, move) {
        this._validatePlayerMove(playerId);
        if (!this.isValidMove(playerId, move)) {
            throw new Error('Invalid move');
        }
        if (this._simultaneousMoves) {
            // Для одновременных ходов - сохраняем ход и ждем остальных
            this._addPendingMove(playerId, move);
        }
        else {
            // Для последовательных ходов - выполняем сразу
            this._executeMove(playerId, move);
            this._addMoveToHistory(playerId, move);
        }
        // Проверяем, все ли игроки сделали ходы (для одновременных ходов)
        if (this._simultaneousMoves && this._allPlayersMoved()) {
            this._processAllMoves();
        }
        // Проверяем окончание игры
        if (this._checkGameEnd()) {
            this._finishGame(this._determineWinner());
        }
        this._emitStateChange();
        return this.getState();
    }
    // Управление одновременными ходами
    _addPendingMove(playerId, move) {
        this._pendingMoves.set(playerId, move);
        this._emitEvent({
            type: 'move_submitted',
            playerId,
            data: { move, playersReady: this._pendingMoves.size, totalPlayers: this._players.length },
            timestamp: new Date()
        });
    }
    _allPlayersMoved() {
        return this._pendingMoves.size >= this._getActivePlayers().length;
    }
    _getActivePlayers() {
        // Переопределяется в наследниках для определения активных игроков
        return this._players.map(p => p.id);
    }
    _processAllMoves() {
        const moves = Array.from(this._pendingMoves.entries());
        // Сортируем ходы (если нужен определенный порядок)
        const sortedMoves = this._sortMoves(moves);
        // Выполняем все ходы
        for (const [playerId, move] of sortedMoves) {
            this._executeMove(playerId, move);
            this._addMoveToHistory(playerId, move);
        }
        // Очищаем ожидающие ходы
        this._pendingMoves.clear();
        this._emitEvent({
            type: 'round_completed',
            data: {
                roundNumber: this._roundNumber,
                movesProcessed: sortedMoves.length
            },
            timestamp: new Date()
        });
        // Переходим к следующему раунду
        this._nextRound();
    }
    _sortMoves(moves) {
        // По умолчанию - случайный порядок
        return moves.sort(() => Math.random() - 0.5);
    }
    _nextRound() {
        this._roundNumber++;
        this._emitEvent({
            type: 'round_started',
            data: { roundNumber: this._roundNumber },
            timestamp: new Date()
        });
        // Запускаем таймер раунда, если настроен
        if (this._roundDuration) {
            this._startRoundTimer();
        }
    }
    // Управление таймерами
    _startGameTimer() {
        if (!this.settings.timeLimit)
            return;
        this._timeRemaining = this.settings.timeLimit;
        this._gameTimer = setInterval(() => {
            if (this._timeRemaining && this._timeRemaining > 0) {
                this._timeRemaining--;
                // Уведомляем о оставшемся времени
                if (this._timeRemaining % 10 === 0 || this._timeRemaining <= 5) {
                    this._emitEvent({
                        type: 'time_warning',
                        data: { timeRemaining: this._timeRemaining },
                        timestamp: new Date()
                    });
                }
            }
            else {
                this._handleGameTimeout();
            }
        }, 1000);
    }
    _stopGameTimer() {
        if (this._gameTimer) {
            clearInterval(this._gameTimer);
            this._gameTimer = undefined;
        }
    }
    _startRoundTimer() {
        if (!this._roundDuration)
            return;
        this._roundTimer = setTimeout(() => {
            this._handleRoundTimeout();
        }, this._roundDuration * 1000);
    }
    _stopRoundTimer() {
        if (this._roundTimer) {
            clearTimeout(this._roundTimer);
            this._roundTimer = undefined;
        }
    }
    _handleGameTimeout() {
        this._emitEvent({
            type: 'game_timeout',
            timestamp: new Date()
        });
        this._finishGame(this._determineWinner());
    }
    _handleRoundTimeout() {
        this._emitEvent({
            type: 'round_timeout',
            data: { roundNumber: this._roundNumber },
            timestamp: new Date()
        });
        // Выполняем ходы по умолчанию для игроков, которые не успели
        this._handleDefaultMoves();
        // Обрабатываем все ходы
        if (this._simultaneousMoves) {
            this._processAllMoves();
        }
    }
    _handleDefaultMoves() {
        const activePlayers = this._getActivePlayers();
        for (const playerId of activePlayers) {
            if (!this._pendingMoves.has(playerId)) {
                const defaultMove = this._getDefaultMove(playerId);
                if (defaultMove !== null) {
                    this._addPendingMove(playerId, defaultMove);
                }
            }
        }
    }
    _getDefaultMove(playerId) {
        // Переопределяется в наследниках
        return null;
    }
    // Переопределяем инициализацию
    _initializeGame() {
        super._initializeGame();
        this._gameStartTime = new Date();
        this._roundNumber = 1;
        this._pendingMoves.clear();
        this._emitEvent({
            type: 'realtime_game_started',
            data: {
                gameStartTime: this._gameStartTime,
                simultaneousMoves: this._simultaneousMoves
            },
            timestamp: new Date()
        });
        // Запускаем таймеры
        this._startGameTimer();
        if (this._roundDuration) {
            this._startRoundTimer();
        }
    }
    // Переопределяем очистку
    _onCleanup() {
        super._onCleanup();
        this._stopGameTimer();
        this._stopRoundTimer();
        this._pendingMoves.clear();
    }
    // Переопределяем getState для добавления информации реального времени
    _getRealtimeState() {
        return {
            ...this._getBaseState(),
            gameStartTime: this._gameStartTime || new Date(),
            timeRemaining: this._timeRemaining,
            simultaneousMoves: this._simultaneousMoves
        };
    }
    // Утилитарные методы
    getRemainingGameTime() {
        return this._timeRemaining || 0;
    }
    getElapsedTime() {
        if (!this._gameStartTime)
            return 0;
        return (Date.now() - this._gameStartTime.getTime()) / 1000;
    }
    getPlayersPendingMoves() {
        return Array.from(this._pendingMoves.keys());
    }
    getPlayersWaitingForMove() {
        const activePlayers = this._getActivePlayers();
        return activePlayers.filter(playerId => !this._pendingMoves.has(playerId));
    }
    hasPlayerMoved(playerId) {
        return this._pendingMoves.has(playerId);
    }
    // Настройки для реалтайм игр
    _setSimultaneousMoves(enabled) {
        this._simultaneousMoves = enabled;
    }
    _setRoundDuration(seconds) {
        this._roundDuration = seconds;
    }
    // Форсированное завершение раунда (для внешних триггеров)
    forceRoundEnd() {
        if (this._status !== 'in_progress') {
            throw new Error('Game is not in progress');
        }
        this._stopRoundTimer();
        this._handleDefaultMoves();
        if (this._simultaneousMoves) {
            this._processAllMoves();
        }
        return this.getState();
    }
}
exports.RealtimeGame = RealtimeGame;
//# sourceMappingURL=RealtimeGame.js.map