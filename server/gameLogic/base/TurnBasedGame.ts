import { BaseGame } from './BaseGame';
import { GameTypes, IPlayer } from '../../types/game.interfaces';

/**
 * Абстрактный класс для пошаговых игр
 * Добавляет логику управления ходами и таймерами
 */
export abstract class TurnBasedGame<TState extends GameTypes.ITurnBasedState = GameTypes.ITurnBasedState, TMove = any> 
  extends BaseGame<TState, TMove> {
  
  protected _currentPlayerIndex: number = 0;
  protected _turnStartTime?: Date;
  protected _turnTimer?: NodeJS.Timeout;
  
  // Геттеры
  public get currentPlayerId(): string | undefined {
    return this._players[this._currentPlayerIndex]?.id;
  }
  
  public get currentPlayerIndex(): number {
    return this._currentPlayerIndex;
  }
  
  public get turnStartTime(): Date | undefined {
    return this._turnStartTime;
  }
  
  // Переопределяем базовые методы
  public makeMove(playerId: string, move: TMove): TState {
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
    } else {
      // Переходим к следующему ходу
      this._nextTurn();
    }
    
    this._emitStateChange();
    return this.getState();
  }
  
  // Абстрактные методы для реализации в наследниках
  protected abstract _executeMove(playerId: string, move: TMove): void;
  protected abstract _checkGameEnd(): boolean;
  protected abstract _determineWinner(): string | 'draw' | null;
  
  // Управление ходами
  protected _nextTurn(): void {
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
  
  protected _shouldSkipPlayer(player: IPlayer): boolean {
    // Переопределяется в наследниках для специфичной логики
    // Например, в покере - если игрок сбросил карты
    return false;
  }
  
  protected _validateTurn(playerId: string): void {
    if (this.currentPlayerId !== playerId) {
      throw new Error('Not your turn');
    }
  }
  
  protected _startTurnTimer(): void {
    if (!this.settings.timeLimit) return;
    
    this._turnTimer = setTimeout(() => {
      this._handleTurnTimeout();
    }, this.settings.timeLimit * 1000);
  }
  
  protected _stopTurnTimer(): void {
    if (this._turnTimer) {
      clearTimeout(this._turnTimer);
      this._turnTimer = undefined;
    }
  }
  
  protected _handleTurnTimeout(): void {
    const currentPlayer = this.currentPlayerId;
    if (!currentPlayer) return;
    
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
  
  protected _handleDefaultMove(playerId: string): void {
    // Переопределяется в наследниках
    // Например, в крестиках-ноликах - пропуск хода
    // В покере - fold
  }
  
  // Переопределяем инициализацию
  protected _initializeGame(): void {
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
  
  protected _chooseStartingPlayer(): number {
    // По умолчанию - случайный игрок
    return Math.floor(Math.random() * this._players.length);
  }
  
  // Переопределяем очистку
  protected _onCleanup(): void {
    super._onCleanup();
    this._stopTurnTimer();
  }
  
  // Переопределяем удаление игрока
  protected _handlePlayerRemoval(playerId: string): void {
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
  protected _getTurnBasedState(): GameTypes.ITurnBasedState {
    return {
      ...this._getBaseState(),
      currentPlayerId: this.currentPlayerId || '',
      turnStartTime: this._turnStartTime,
      turnTimeLimit: this.settings.timeLimit,
      moveHistory: this.moveHistory
    };
  }
  
  // Утилитарные методы
  public getRemainingTurnTime(): number {
    if (!this.settings.timeLimit || !this._turnStartTime) {
      return 0;
    }
    
    const elapsed = (Date.now() - this._turnStartTime.getTime()) / 1000;
    return Math.max(0, this.settings.timeLimit - elapsed);
  }
  
  public isTurnExpired(): boolean {
    return this.getRemainingTurnTime() <= 0;
  }
  
  public getCurrentPlayer(): IPlayer | null {
    return this.currentPlayerId ? this.getPlayer(this.currentPlayerId) : null;
  }
}
