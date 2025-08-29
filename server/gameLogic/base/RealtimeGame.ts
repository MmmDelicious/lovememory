import { BaseGame } from './BaseGame';
import { GameTypes } from '../../types/game.interfaces';

/**
 * Абстрактный класс для игр реального времени
 * Добавляет логику одновременных ходов и глобальных таймеров
 */
export abstract class RealtimeGame<TState extends GameTypes.IRealtimeGameState = GameTypes.IRealtimeGameState, TMove = any> 
  extends BaseGame<TState, TMove> {
  
  protected _gameStartTime?: Date;
  protected _gameTimer?: NodeJS.Timeout;
  protected _timeRemaining?: number;
  protected _simultaneousMoves: boolean = true;
  protected _pendingMoves: Map<string, TMove> = new Map();
  protected _roundNumber: number = 1;
  protected _roundTimer?: NodeJS.Timeout;
  protected _roundDuration?: number; // в секундах
  
  // Геттеры
  public get gameStartTime(): Date | undefined {
    return this._gameStartTime;
  }
  
  public get timeRemaining(): number | undefined {
    return this._timeRemaining;
  }
  
  public get simultaneousMoves(): boolean {
    return this._simultaneousMoves;
  }
  
  public get roundNumber(): number {
    return this._roundNumber;
  }
  
  public get pendingMoves(): Map<string, TMove> {
    return new Map(this._pendingMoves);
  }
  
  // Переопределяем makeMove для обработки одновременных ходов
  public makeMove(playerId: string, move: TMove): TState {
    this._validatePlayerMove(playerId);
    
    if (!this.isValidMove(playerId, move)) {
      throw new Error('Invalid move');
    }
    
    if (this._simultaneousMoves) {
      // Для одновременных ходов - сохраняем ход и ждем остальных
      this._addPendingMove(playerId, move);
    } else {
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
  
  // Абстрактные методы для реализации в наследниках
  protected abstract _executeMove(playerId: string, move: TMove): void;
  protected abstract _checkGameEnd(): boolean;
  protected abstract _determineWinner(): string | 'draw' | null;
  
  // Управление одновременными ходами
  protected _addPendingMove(playerId: string, move: TMove): void {
    this._pendingMoves.set(playerId, move);
    
    this._emitEvent({
      type: 'move_submitted',
      playerId,
      data: { move, playersReady: this._pendingMoves.size, totalPlayers: this._players.length },
      timestamp: new Date()
    });
  }
  
  protected _allPlayersMoved(): boolean {
    return this._pendingMoves.size >= this._getActivePlayers().length;
  }
  
  protected _getActivePlayers(): string[] {
    // Переопределяется в наследниках для определения активных игроков
    return this._players.map(p => p.id);
  }
  
  protected _processAllMoves(): void {
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
  
  protected _sortMoves(moves: [string, TMove][]): [string, TMove][] {
    // По умолчанию - случайный порядок
    return moves.sort(() => Math.random() - 0.5);
  }
  
  protected _nextRound(): void {
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
  protected _startGameTimer(): void {
    if (!this.settings.timeLimit) return;
    
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
      } else {
        this._handleGameTimeout();
      }
    }, 1000);
  }
  
  protected _stopGameTimer(): void {
    if (this._gameTimer) {
      clearInterval(this._gameTimer);
      this._gameTimer = undefined;
    }
  }
  
  protected _startRoundTimer(): void {
    if (!this._roundDuration) return;
    
    this._roundTimer = setTimeout(() => {
      this._handleRoundTimeout();
    }, this._roundDuration * 1000);
  }
  
  protected _stopRoundTimer(): void {
    if (this._roundTimer) {
      clearTimeout(this._roundTimer);
      this._roundTimer = undefined;
    }
  }
  
  protected _handleGameTimeout(): void {
    this._emitEvent({
      type: 'game_timeout',
      timestamp: new Date()
    });
    
    this._finishGame(this._determineWinner());
  }
  
  protected _handleRoundTimeout(): void {
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
  
  protected _handleDefaultMoves(): void {
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
  
  protected _getDefaultMove(playerId: string): TMove | null {
    // Переопределяется в наследниках
    return null;
  }
  
  // Переопределяем инициализацию
  protected _initializeGame(): void {
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
  protected _onCleanup(): void {
    super._onCleanup();
    this._stopGameTimer();
    this._stopRoundTimer();
    this._pendingMoves.clear();
  }
  
  // Переопределяем getState для добавления информации реального времени
  protected _getRealtimeState(): GameTypes.IRealtimeGameState {
    return {
      ...this._getBaseState(),
      gameStartTime: this._gameStartTime || new Date(),
      timeRemaining: this._timeRemaining,
      simultaneousMoves: this._simultaneousMoves
    };
  }
  
  // Утилитарные методы
  public getRemainingGameTime(): number {
    return this._timeRemaining || 0;
  }
  
  public getElapsedTime(): number {
    if (!this._gameStartTime) return 0;
    return (Date.now() - this._gameStartTime.getTime()) / 1000;
  }
  
  public getPlayersPendingMoves(): string[] {
    return Array.from(this._pendingMoves.keys());
  }
  
  public getPlayersWaitingForMove(): string[] {
    const activePlayers = this._getActivePlayers();
    return activePlayers.filter(playerId => !this._pendingMoves.has(playerId));
  }
  
  public hasPlayerMoved(playerId: string): boolean {
    return this._pendingMoves.has(playerId);
  }
  
  // Настройки для реалтайм игр
  protected _setSimultaneousMoves(enabled: boolean): void {
    this._simultaneousMoves = enabled;
  }
  
  protected _setRoundDuration(seconds: number): void {
    this._roundDuration = seconds;
  }
  
  // Форсированное завершение раунда (для внешних триггеров)
  public forceRoundEnd(): TState {
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
