import { 
  IGame, 
  IGameState, 
  IPlayer, 
  IGameSettings,
  IGameEvent,
  StateChangeCallback,
  GameEventCallback,
  GameStatus,
  IGameMove
} from '../../types/game.interfaces';

/**
 * Абстрактный базовый класс для всех игр
 * Содержит общую логику управления игроками, состоянием и событиями
 */
export abstract class BaseGame<TState extends IGameState = IGameState, TMove = any> 
  implements IGame<TState, TMove> {
  
  // Абстрактные свойства, которые должны быть реализованы в наследниках
  public abstract readonly gameType: string;
  
  // Основные свойства
  protected _players: IPlayer[] = [];
  protected _status: GameStatus = 'waiting';
  protected _winner: string | 'draw' | null = null;
  protected _roomId?: string;
  protected _createdAt: Date;
  protected _startedAt?: Date;
  protected _finishedAt?: Date;
  protected _lastMoveAt?: Date;
  protected _moveHistory: IGameMove[] = [];
  
  // Настройки игры
  public readonly settings: IGameSettings;
  
  // Колбэки для событий
  public onStateChange?: StateChangeCallback;
  public onGameEvent?: GameEventCallback;
  
  constructor(roomId?: string, settings?: Partial<IGameSettings>) {
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
  public get players(): IPlayer[] {
    return [...this._players];
  }
  
  public get status(): GameStatus {
    return this._status;
  }
  
  public get winner(): string | 'draw' | null {
    return this._winner;
  }
  
  public get roomId(): string | undefined {
    return this._roomId;
  }
  
  public get moveHistory(): IGameMove[] {
    return [...this._moveHistory];
  }
  
  // Управление игроками
  public addPlayer(player: IPlayer): TState {
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
  
  public removePlayer(playerId: string): TState {
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
  
  public getPlayer(playerId: string): IPlayer | null {
    return this._players.find(p => p.id === playerId) || null;
  }
  
  public setPlayerReady(playerId: string, ready: boolean = true): TState {
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
  public startGame(): TState {
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
  
  public isGameFinished(): boolean {
    return this._status === 'finished';
  }
  
  // Абстрактные методы для реализации в наследниках
  public abstract makeMove(playerId: string, move: TMove): TState;
  public abstract isValidMove(playerId: string, move: TMove): boolean;
  public abstract getState(): TState;
  
  // Опциональные методы для переопределения
  public getValidMoves?(playerId: string): TMove[];
  
  // Защищенные методы для использования в наследниках
  protected _addMoveToHistory(playerId: string, move: TMove, data?: any): void {
    const gameMove: IGameMove = {
      playerId,
      timestamp: new Date(),
      data: { move, ...data }
    };
    
    this._moveHistory.push(gameMove);
    this._lastMoveAt = gameMove.timestamp;
  }
  
  protected _finishGame(winner: string | 'draw' | null): void {
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
  
  protected _emitEvent(event: IGameEvent): void {
    if (this.onGameEvent) {
      this.onGameEvent(event);
    }
  }
  
  protected _emitStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }
  
  protected _getBaseState(): IGameState {
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
  protected _initializeGame(): void {
    // Базовая инициализация - переопределяется в наследниках
  }
  
  protected _handlePlayerRemoval(playerId: string): void {
    // Если осталось слишком мало игроков
    if (this._players.length < this.settings.minPlayers && this._status === 'in_progress') {
      this._finishGame(null); // Игра прерывается
    }
  }
  
  protected _checkAutoStart(): void {
    if (this._status === 'waiting' && 
        this._players.length >= this.settings.minPlayers &&
        this._players.every(p => p.ready)) {
      this.startGame();
    }
  }
  
  // Очистка ресурсов
  public cleanup(): void {
    this.onStateChange = undefined;
    this.onGameEvent = undefined;
    // Дополнительная очистка в наследниках
    this._onCleanup();
  }
  
  protected _onCleanup(): void {
    // Переопределяется в наследниках для специфичной очистки
  }
  
  // Утилитарные методы
  protected _getCurrentTimestamp(): Date {
    return new Date();
  }
  
  protected _isPlayerInGame(playerId: string): boolean {
    return this._players.some(p => p.id === playerId);
  }
  
  protected _validatePlayerMove(playerId: string): void {
    if (this._status !== 'in_progress') {
      throw new Error('Game is not in progress');
    }
    
    if (!this._isPlayerInGame(playerId)) {
      throw new Error('Player not in game');
    }
  }
}
