import { TurnBasedGame } from '../base/TurnBasedGame';
import { GameTypes, IGameSettings } from '../../types/game.interfaces';

// Импортируем chess.js (нужно будет установить типы)
const { Chess } = require('chess.js');

// Специфичные типы для шахмат
interface IChessState extends GameTypes.ITurnBasedState {
  board: Record<string, string>; // square -> piece
  turn: 'w' | 'b';
  fen: string;
  whiteTime: number;
  blackTime: number;
  moveHistorySan: string[]; // История ходов в алгебраической нотации
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  canCastleKingSide: { white: boolean; black: boolean };
  canCastleQueenSide: { white: boolean; black: boolean };
  enPassantSquare?: string;
  drawOffer?: string | null; // ID игрока, предложившего ничью
  isPaused?: boolean;
  gameStatus?: 'playing' | 'check' | 'checkmate' | 'draw' | 'paused' | 'resigned';
  capturedPieces?: {
    white: string[];
    black: string[];
  };
}

interface IChessMove {
  from: string;
  to: string;
  promotion?: string; // 'q', 'r', 'b', 'n'
}

interface IChessAction {
  action: 'offer_draw' | 'accept_draw' | 'decline_draw' | 'resign' | 'pause' | 'request_undo';
}

type IChessMoveOrAction = IChessMove | IChessAction;

interface IChessSettings extends IGameSettings {
  whiteTime?: number; // Время для белых в секундах
  blackTime?: number; // Время для черных в секундах  
  increment?: number; // Инкремент времени за ход в секундах
}

/**
 * Новая реализация шахмат на основе TurnBasedGame
 * Использует chess.js для валидации и логики игры
 */
export class ChessGameNew extends TurnBasedGame<IChessState, IChessMove> {
  public readonly gameType = 'chess';
  
  // Шахматный движок
  private _chessEngine: any;
  
  // Таймеры
  private _whiteTime: number;
  private _blackTime: number;
  private _increment: number;
  private _lastMoveTime?: Date;
  
  // История ходов в SAN нотации
  private _moveHistorySan: string[] = [];
  
  // Специальные состояния игры
  private _drawOffer: string | null = null;
  private _isPaused: boolean = false;
  private _capturedPieces: { white: string[]; black: string[] } = { white: [], black: [] };
  
  constructor(roomId?: string, settings?: Partial<IChessSettings>) {
    // Настройки для шахмат
    const chessSettings: IChessSettings = {
      maxPlayers: 2,
      minPlayers: 2,
      timeLimit: undefined, // Используем собственную систему времени
      difficulty: 'medium',
      whiteTime: 300, // 5 минут
      blackTime: 300, // 5 минут
      increment: 2, // 2 секунды инкремент
      ...settings
    };
    
    super(roomId, chessSettings);
    
    this._whiteTime = chessSettings.whiteTime!;
    this._blackTime = chessSettings.blackTime!;
    this._increment = chessSettings.increment!;
    
    // Инициализируем шахматный движок
    this._chessEngine = new Chess();
  }
  
  // Реализация абстрактных методов TurnBasedGame
  protected _executeMove(playerId: string, moveOrAction: IChessMoveOrAction): void {
    // Проверяем, это обычный ход или специальное действие
    if ('action' in moveOrAction) {
      this._handleSpecialAction(playerId, moveOrAction);
      return;
    }
    
    this._handleChessMove(playerId, moveOrAction);
  }
  
  private _handleChessMove(playerId: string, move: IChessMove): void {
    const playerIndex = this._players.findIndex(p => p.id === playerId);
    const playerColor = playerIndex === 0 ? 'w' : 'b';
    
    // Проверяем, что ход от правильного игрока
    if (this._chessEngine.turn() !== playerColor) {
      throw new Error('Not your turn');
    }
    
    // Проверяем, что фигура принадлежит игроку
    const piece = this._chessEngine.get(move.from);
    if (!piece || piece.color !== playerColor) {
      throw new Error('Cannot move opponent\'s piece or empty square');
    }
    
    // Вычитаем прошедшее время перед добавлением инкремента
    if (this._lastMoveTime) {
      const elapsed = (Date.now() - this._lastMoveTime.getTime()) / 1000;
      if (playerColor === 'w') {
        this._whiteTime = Math.max(0, this._whiteTime - elapsed);
      } else {
        this._blackTime = Math.max(0, this._blackTime - elapsed);
      }
    }
    
    // Добавляем инкремент времени
    if (playerColor === 'w') {
      this._whiteTime += this._increment;
    } else {
      this._blackTime += this._increment;
    }
    
    // Выполняем ход
    const result = this._chessEngine.move(move);
    if (result === null) {
      // Восстанавливаем время при неверном ходе
      if (this._lastMoveTime) {
        const elapsed = (Date.now() - this._lastMoveTime.getTime()) / 1000;
        if (playerColor === 'w') {
          this._whiteTime += elapsed - this._increment;
        } else {
          this._blackTime += elapsed - this._increment;
        }
      } else {
        if (playerColor === 'w') {
          this._whiteTime -= this._increment;
        } else {
          this._blackTime -= this._increment;
        }
      }
      throw new Error('Invalid chess move');
    }
    
    // Отслеживаем взятые фигуры
    if (result.captured) {
      const capturedPiece = result.captured;
      if (playerColor === 'w') {
        this._capturedPieces.white.push(capturedPiece);
      } else {
        this._capturedPieces.black.push(capturedPiece);
      }
    }
    
    // Добавляем в историю
    this._moveHistorySan.push(result.san);
    this._lastMoveTime = new Date();
    
    // Сбрасываем предложение ничьей после любого хода
    this._drawOffer = null;
    
    this._emitEvent({
      type: 'chess_move_made',
      playerId,
      data: {
        move: result,
        san: result.san,
        fen: this._chessEngine.fen(),
        isCheck: this._chessEngine.inCheck(),
        isCheckmate: this._chessEngine.isCheckmate(),
        isStalemate: this._chessEngine.isStalemate()
      },
      timestamp: new Date()
    });
  }
  
  private _handleSpecialAction(playerId: string, action: IChessAction): void {
    switch (action.action) {
      case 'offer_draw':
        this._drawOffer = playerId;
        this._emitEvent({
          type: 'draw_offered',
          playerId,
          data: { offeredBy: playerId },
          timestamp: new Date()
        });
        break;
        
      case 'accept_draw':
        if (this._drawOffer && this._drawOffer !== playerId) {
          this._drawOffer = null;
          this._emitEvent({
            type: 'draw_accepted',
            playerId,
            data: { result: 'draw' },
            timestamp: new Date()
          });
          // Завершаем игру ничьей
          this._forceFinishGame('draw');
        }
        break;
        
      case 'decline_draw':
        if (this._drawOffer && this._drawOffer !== playerId) {
          this._drawOffer = null;
          this._emitEvent({
            type: 'draw_declined',
            playerId,
            data: { declinedBy: playerId },
            timestamp: new Date()
          });
        }
        break;
        
      case 'resign':
        const winnerIndex = this._players.findIndex(p => p.id === playerId) === 0 ? 1 : 0;
        const winnerId = this._players[winnerIndex]?.id;
        this._emitEvent({
          type: 'player_resigned',
          playerId,
          data: { winner: winnerId },
          timestamp: new Date()
        });
        this._forceFinishGame(winnerId || null);
        break;
        
      case 'pause':
        this._isPaused = !this._isPaused;
        this._emitEvent({
          type: 'game_paused',
          playerId,
          data: { isPaused: this._isPaused },
          timestamp: new Date()
        });
        break;
        
      case 'request_undo':
        // Простая реализация - пока просто эмитим событие
        this._emitEvent({
          type: 'undo_requested',
          playerId,
          data: { requestedBy: playerId },
          timestamp: new Date()
        });
        break;
    }
  }
  
  protected _checkGameEnd(): boolean {
    return this._chessEngine.isGameOver() || this._isTimeOut();
  }
  
  protected _determineWinner(): string | 'draw' | null {
    // Проверяем таймаут
    if (this._isTimeOut()) {
      const currentColor = this._chessEngine.turn();
      // Время закончилось у текущего игрока
      const winnerIndex = currentColor === 'w' ? 1 : 0;
      return this._players[winnerIndex]?.id || null;
    }
    
    // Проверяем шахматный мат
    if (this._chessEngine.isCheckmate()) {
      // Победил игрок, который НЕ ходит сейчас (так как мат поставлен)
      const loserColor = this._chessEngine.turn();
      const winnerIndex = loserColor === 'w' ? 1 : 0;
      return this._players[winnerIndex]?.id || null;
    }
    
    // Все остальные случаи - ничья
    if (this._chessEngine.isStalemate() || 
        this._chessEngine.isThreefoldRepetition() ||
        this._chessEngine.isInsufficientMaterial() ||
        this._chessEngine.isDraw()) {
      return 'draw';
    }
    
    return null;
  }
  
  // Реализация валидации ходов
  public isValidMove(playerId: string, moveOrAction: IChessMoveOrAction): boolean {
    // Специальные действия всегда валидны (дополнительные проверки в _handleSpecialAction)
    if ('action' in moveOrAction) {
      return true;
    }
    
    return this._isValidChessMove(playerId, moveOrAction);
  }
  
  public _isValidChessMove(playerId: string, move: IChessMove): boolean {
    try {
      this._validatePlayerMove(playerId);
      this._validateTurn(playerId);
      
      const playerIndex = this._players.findIndex(p => p.id === playerId);
      const playerColor = playerIndex === 0 ? 'w' : 'b';
      
      // Проверяем, что сейчас ход этого игрока
      if (this._chessEngine.turn() !== playerColor) {
        return false;
      }
      
      // Проверяем, что фигура принадлежит игроку
      const piece = this._chessEngine.get(move.from);
      if (!piece || piece.color !== playerColor) {
        return false;
      }
      
      // Проверяем валидность хода через chess.js
      const tempEngine = new Chess(this._chessEngine.fen());
      const result = tempEngine.move(move);
      
      return result !== null;
    } catch {
      return false;
    }
  }
  
  public getValidMoves(playerId: string): IChessMove[] {
    if (!this._isPlayerInGame(playerId) || this.currentPlayerId !== playerId) {
      return [];
    }
    
    const moves = this._chessEngine.moves({ verbose: true });
    return moves.map((move: any) => ({
      from: move.from,
      to: move.to,
      promotion: move.promotion
    }));
  }
  
  // Метод для получения валидных ходов с конкретной клетки
  public getValidMovesFromSquare(playerId: string, square: string): string[] {
    if (!this._isPlayerInGame(playerId) || this.currentPlayerId !== playerId) {
      return [];
    }
    
    try {
      const moves = this._chessEngine.moves({ square, verbose: true });
      return moves.map((move: any) => move.to);
    } catch {
      return [];
    }
  }
  
  // Переопределяем getState для специфичных данных шахмат
  public getState(): IChessState {
    const board: Record<string, string> = {};
    
    // Заполняем доску из FEN позиции
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    ranks.forEach(rank => {
      files.forEach(file => {
        const square = `${file}${rank}`;
        const piece = this._chessEngine.get(square);
        if (piece) {
          board[square] = piece.color === 'w' 
            ? piece.type.toUpperCase() 
            : piece.type.toLowerCase();
        }
      });
    });
    
    return {
      ...this._getTurnBasedState(),
      board,
      turn: this._chessEngine.turn(),
      fen: this._chessEngine.fen(),
      whiteTime: this._whiteTime,
      blackTime: this._blackTime,
      moveHistorySan: [...this._moveHistorySan],
      isCheck: this._chessEngine.inCheck(),
      isCheckmate: this._chessEngine.isCheckmate(),
      isStalemate: this._chessEngine.isStalemate(),
      isDraw: this._chessEngine.isDraw(),
      canCastleKingSide: this._getCastlingRights().kingSide,
      canCastleQueenSide: this._getCastlingRights().queenSide,
      drawOffer: this._drawOffer,
      isPaused: this._isPaused,
      gameStatus: this._getGameStatus(),
      capturedPieces: {
        white: [...this._capturedPieces.white],
        black: [...this._capturedPieces.black]
      },
      enPassantSquare: this._chessEngine.fen().split(' ')[3] !== '-' 
        ? this._chessEngine.fen().split(' ')[3] 
        : undefined
    };
  }
  
  // Переопределяем инициализацию игры
  protected _initializeGame(): void {
    // Сбрасываем шахматную доску
    this._chessEngine = new Chess();
    this._moveHistorySan = [];
    this._lastMoveTime = new Date();
    this._drawOffer = null;
    this._isPaused = false;
    this._capturedPieces = { white: [], black: [] };

    // Вызываем базовую инициализацию СНАЧАЛА (она установит _currentPlayerIndex через _chooseStartingPlayer)
    super._initializeGame();

    this._emitEvent({
      type: 'chess_game_initialized',
      data: {
        fen: this._chessEngine.fen(),
        whitePlayer: this._players[0]?.id,
        blackPlayer: this._players[1]?.id,
        whiteTime: this._whiteTime,
        blackTime: this._blackTime,
        increment: this._increment
      },
      timestamp: new Date()
    });
  }
  
  // Переопределяем выбор начинающего игрока (всегда белые)
  protected _chooseStartingPlayer(): number {
    return 0; // Белые всегда первые
  }
  
  // Переопределяем обработку таймаута
  protected _handleDefaultMove(playerId: string): void {
    // В шахматах при таймауте игрок проигрывает
    // Не делаем автоматических ходов
    this._emitEvent({
      type: 'time_forfeit',
      playerId,
      data: { reason: 'Time expired' },
      timestamp: new Date()
    });
  }
  
  // Приватные методы
  private _isTimeOut(): boolean {
    if (!this._lastMoveTime) return false;
    
    const currentColor = this._chessEngine.turn();
    const timeLimit = currentColor === 'w' ? this._whiteTime : this._blackTime;
    
    const elapsed = (Date.now() - this._lastMoveTime.getTime()) / 1000;
    return elapsed >= timeLimit;
  }
  
  // Утилитарные методы
  public getFen(): string {
    return this._chessEngine.fen();
  }
  
  public loadFen(fen: string): boolean {
    try {
      const result = this._chessEngine.load(fen);
      if (result) {
        this._moveHistorySan = [];
        this._lastMoveTime = new Date();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  
  public getPgn(): string {
    return this._chessEngine.pgn();
  }
  
  public getGameHistory(): string[] {
    return [...this._moveHistorySan];
  }
  
  public getCurrentPlayerColor(): 'white' | 'black' | null {
    const currentPlayerId = this.currentPlayerId;
    if (!currentPlayerId) return null;
    
    const playerIndex = this._players.findIndex(p => p.id === currentPlayerId);
    return playerIndex === 0 ? 'white' : 'black';
  }
  
  public getRemainingTime(color: 'white' | 'black'): number {
    if (!this._lastMoveTime) {
      return color === 'white' ? this._whiteTime : this._blackTime;
    }
    
    const currentColor = this._chessEngine.turn();
    const isCurrentPlayer = (color === 'white' && currentColor === 'w') ||
                           (color === 'black' && currentColor === 'b');
    
    if (isCurrentPlayer) {
      const elapsed = (Date.now() - this._lastMoveTime.getTime()) / 1000;
      const baseTime = color === 'white' ? this._whiteTime : this._blackTime;
      return Math.max(0, baseTime - elapsed);
    }
    
    return color === 'white' ? this._whiteTime : this._blackTime;
  }
  
  public isInCheck(): boolean {
    return this._chessEngine.inCheck();
  }
  
  public getCheckingSquares(): string[] {
    if (!this.isInCheck()) return [];
    
    // Правильный способ найти атакующие фигуры
    const currentTurn = this._chessEngine.turn();
    const kingSquare = this._findKing(currentTurn);
    
    if (!kingSquare) return [];
    
    const attackingSquares: string[] = [];
    
    // Создаем временный движок с противоположным ходом
    const tempEngine = new Chess(this._chessEngine.fen());
    
    // Проверяем все клетки на предмет атак на короля
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    for (const file of files) {
      for (const rank of ranks) {
        const square = `${file}${rank}`;
        const piece = tempEngine.get(square);
        
        // Если фигура противника
        if (piece && piece.color !== currentTurn) {
          const moves = tempEngine.moves({ square, verbose: true });
          if (moves.some((move: any) => move.to === kingSquare)) {
            attackingSquares.push(square);
          }
        }
      }
    }
    
    return attackingSquares;
  }
  
  private _findKing(color: 'w' | 'b'): string | null {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    for (const file of files) {
      for (const rank of ranks) {
        const square = `${file}${rank}`;
        const piece = this._chessEngine.get(square);
        if (piece && piece.type === 'k' && piece.color === color) {
          return square;
        }
      }
    }
    
    return null;
  }
  
  // Переопределяем очистку
  protected _onCleanup(): void {
    super._onCleanup();
    this._moveHistorySan = [];
    this._chessEngine = null;
    this._drawOffer = null;
    this._isPaused = false;
    this._capturedPieces = { white: [], black: [] };
  }
  
  // Приватные утилитарные методы
  private _getCastlingRights(): { kingSide: { white: boolean; black: boolean }, queenSide: { white: boolean; black: boolean } } {
    const fen = this._chessEngine.fen();
    const castlingRights = fen.split(' ')[2];
    
    return {
      kingSide: {
        white: castlingRights.includes('K'),
        black: castlingRights.includes('k')
      },
      queenSide: {
        white: castlingRights.includes('Q'),
        black: castlingRights.includes('q')
      }
    };
  }
  
  private _getGameStatus(): 'playing' | 'check' | 'checkmate' | 'draw' | 'paused' | 'resigned' {
    if (this._isPaused) return 'paused';
    if (this._chessEngine.isCheckmate()) return 'checkmate';
    if (this._chessEngine.isDraw() || this._chessEngine.isStalemate()) return 'draw';
    if (this._chessEngine.inCheck()) return 'check';
    return 'playing';
  }
  
  private _forceFinishGame(winner: string | 'draw' | null): void {
    // Принудительно завершаем игру
    this._status = 'finished';
    this._emitEvent({
      type: 'game_finished',
      data: { winner },
      timestamp: new Date()
    });
  }
}
