import { TurnBasedGame } from '../base/TurnBasedGame';
import { GameTypes, IGameSettings } from '../../types/game.interfaces';

// Специфичные типы для крестиков-ноликов
interface ITicTacToeState extends GameTypes.ITurnBasedState {
  board: (string | null)[];
  symbols: Record<string, string>;
  winner: string | 'draw' | null;
  winningLine?: number[];
}

interface ITicTacToeMove {
  position: number; // позиция на доске (0-8)
}

interface ITicTacToeSettings extends IGameSettings {
  boardSize?: number; // размер доски (по умолчанию 3x3 = 9)
  winCondition?: number; // количество в ряд для победы (по умолчанию 3)
}

/**
 * Новая реализация крестиков-ноликов на основе TurnBasedGame
 * Демонстрирует преимущества новой архитектуры
 */
export class TicTacToeGameNew extends TurnBasedGame<ITicTacToeState, ITicTacToeMove> {
  public readonly gameType = 'tic-tac-toe';
  
  // Игровые данные
  private _board: (string | null)[];
  private _symbols: Record<string, string> = {};
  private _winningLine?: number[];
  private _boardSize: number;
  private _winCondition: number;
  
  // Предопределенные символы
  private readonly SYMBOLS = ['X', 'O', '△', '◯', '★', '♦'];
  
  constructor(roomId?: string, settings?: Partial<ITicTacToeSettings>) {
    // Настройки для крестиков-ноликов
    const ticTacToeSettings: ITicTacToeSettings = {
      maxPlayers: 2,
      minPlayers: 2,
      timeLimit: 30, // 30 секунд на ход
      difficulty: 'easy',
      boardSize: 9, // 3x3
      winCondition: 3,
      ...settings
    };
    
    super(roomId, ticTacToeSettings);
    
    this._boardSize = ticTacToeSettings.boardSize!;
    this._winCondition = ticTacToeSettings.winCondition!;
    this._board = Array(this._boardSize).fill(null);
  }
  
  // Реализация абстрактных методов TurnBasedGame
  protected _executeMove(playerId: string, move: ITicTacToeMove): void {
    const { position } = move;
    
    // Проверяем, что позиция свободна
    if (this._board[position] !== null) {
      throw new Error('Position already taken');
    }
    
    // Размещаем символ игрока
    const symbol = this._symbols[playerId];
    this._board[position] = symbol;
    
    this._emitEvent({
      type: 'move_made',
      playerId,
      data: { position, symbol, board: [...this._board] },
      timestamp: new Date()
    });
  }
  
  protected _checkGameEnd(): boolean {
    // Проверяем победу
    const winner = this._checkWinner();
    if (winner) {
      this._winningLine = this._getWinningLine();
      return true;
    }
    
    // Проверяем ничью (доска полная)
    return this._board.every(cell => cell !== null);
  }
  
  protected _determineWinner(): string | 'draw' | null {
    const winnerSymbol = this._checkWinner();
    
    if (winnerSymbol === 'draw') {
      return 'draw';
    }
    
    if (winnerSymbol) {
      // Находим игрока по символу
      return Object.keys(this._symbols).find(playerId => 
        this._symbols[playerId] === winnerSymbol
      ) || null;
    }
    
    return null;
  }
  
  // Переопределяем makeMove для обратной совместимости со старым API
  public override makeMove(playerId: string, move: ITicTacToeMove | number): ITicTacToeState {
    // Адаптируем старый формат (число) к новому формату (объект)
    let normalizedMove: ITicTacToeMove;
    
    if (typeof move === 'number') {
      // Старый формат - просто позиция
      normalizedMove = { position: move };
    } else {
      // Новый формат - объект с позицией
      normalizedMove = move;
    }
    
    return super.makeMove(playerId, normalizedMove);
  }

  // Реализация валидации ходов
  public isValidMove(playerId: string, move: ITicTacToeMove | number): boolean {
    try {
      this._validatePlayerMove(playerId);
      this._validateTurn(playerId);
      
      // Нормализуем move к новому формату
      const position = typeof move === 'number' ? move : move.position;
      
      // Проверяем границы доски
      if (position < 0 || position >= this._boardSize) {
        return false;
      }
      
      // Проверяем, что позиция свободна
      if (this._board[position] !== null) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  public override getValidMoves(playerId: string): ITicTacToeMove[] {
    if (!this._isPlayerInGame(playerId) || this.currentPlayerId !== playerId) {
      return [];
    }
    
    const validMoves: ITicTacToeMove[] = [];
    
    for (let position = 0; position < this._boardSize; position++) {
      if (this._board[position] === null) {
        validMoves.push({ position });
      }
    }
    
    return validMoves;
  }
  
  // Переопределяем getState для специфичных данных
  public getState(): ITicTacToeState {
    return {
      ...this._getTurnBasedState(),
      board: [...this._board],
      symbols: { ...this._symbols },
      winner: this._winner,
      winningLine: this._winningLine ? [...this._winningLine] : undefined
    };
  }
  
  // Переопределяем инициализацию игры
  protected override _initializeGame(): void {
    // Сбрасываем доску
    this._board = Array(this._boardSize).fill(null);
    this._winningLine = undefined;
    
    // Назначаем символы игрокам
    this._assignSymbols();
    
    super._initializeGame();
    
    this._emitEvent({
      type: 'game_initialized',
      data: {
        board: [...this._board],
        symbols: { ...this._symbols },
        boardSize: this._boardSize,
        winCondition: this._winCondition
      },
      timestamp: new Date()
    });
  }
  
  // Переопределяем обработку таймаута хода
  protected override _handleDefaultMove(playerId: string): void {
    // При таймауте делаем случайный ход
    const validMoves = this.getValidMoves(playerId);
    
    if (validMoves.length > 0) {
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      this._executeMove(playerId, randomMove);
      this._addMoveToHistory(playerId, randomMove, { timeout: true });
      
      this._emitEvent({
        type: 'timeout_move',
        playerId,
        data: { move: randomMove },
        timestamp: new Date()
      });
    }
  }
  
  // Приватные методы для игровой логики
  private _assignSymbols(): void {
    this._symbols = {};
    
    for (let i = 0; i < this._players.length; i++) {
      this._symbols[this._players[i].id] = this.SYMBOLS[i];
    }
  }
  
  private _checkWinner(): string | 'draw' | null {
    const winner = this._checkWinningCombinations();
    if (winner) {
      return winner;
    }
    
    // Проверяем ничью
    const hasEmptyCells = this._board.includes(null);
    return hasEmptyCells ? null : 'draw';
  }
  
  private _checkWinningCombinations(): string | null {
    const winningCombinations = this._generateWinningCombinations();
    
    for (const combination of winningCombinations) {
      const symbols = combination.map(pos => this._board[pos]);
      
      // Проверяем, что все символы одинаковые и не null
      if (symbols[0] && symbols.every(symbol => symbol === symbols[0])) {
        return symbols[0];
      }
    }
    
    return null;
  }
  
  private _getWinningLine(): number[] | undefined {
    const winningCombinations = this._generateWinningCombinations();
    
    for (const combination of winningCombinations) {
      const symbols = combination.map(pos => this._board[pos]);
      
      if (symbols[0] && symbols.every(symbol => symbol === symbols[0])) {
        return combination;
      }
    }
    
    return undefined;
  }
  
  private _generateWinningCombinations(): number[][] {
    const combinations: number[][] = [];
    const size = Math.sqrt(this._boardSize); // Предполагаем квадратную доску
    
    // Горизонтальные линии
    for (let row = 0; row < size; row++) {
      for (let col = 0; col <= size - this._winCondition; col++) {
        const line: number[] = [];
        for (let k = 0; k < this._winCondition; k++) {
          line.push(row * size + col + k);
        }
        combinations.push(line);
      }
    }
    
    // Вертикальные линии
    for (let col = 0; col < size; col++) {
      for (let row = 0; row <= size - this._winCondition; row++) {
        const line: number[] = [];
        for (let k = 0; k < this._winCondition; k++) {
          line.push((row + k) * size + col);
        }
        combinations.push(line);
      }
    }
    
    // Диагонали (слева направо)
    for (let row = 0; row <= size - this._winCondition; row++) {
      for (let col = 0; col <= size - this._winCondition; col++) {
        const line: number[] = [];
        for (let k = 0; k < this._winCondition; k++) {
          line.push((row + k) * size + col + k);
        }
        combinations.push(line);
      }
    }
    
    // Диагонали (справа налево)
    for (let row = 0; row <= size - this._winCondition; row++) {
      for (let col = this._winCondition - 1; col < size; col++) {
        const line: number[] = [];
        for (let k = 0; k < this._winCondition; k++) {
          line.push((row + k) * size + col - k);
        }
        combinations.push(line);
      }
    }
    
    return combinations;
  }
  
  // Дополнительные утилитарные методы
  public getBoardAsMatrix(): (string | null)[][] {
    const size = Math.sqrt(this._boardSize);
    const matrix: (string | null)[][] = [];
    
    for (let row = 0; row < size; row++) {
      const matrixRow: (string | null)[] = [];
      for (let col = 0; col < size; col++) {
        matrixRow.push(this._board[row * size + col]);
      }
      matrix.push(matrixRow);
    }
    
    return matrix;
  }
  
  public getPlayerSymbol(playerId: string): string | null {
    return this._symbols[playerId] || null;
  }
  
  public getEmptyPositions(): number[] {
    const emptyPositions: number[] = [];
    
    for (let i = 0; i < this._board.length; i++) {
      if (this._board[i] === null) {
        emptyPositions.push(i);
      }
    }
    
    return emptyPositions;
  }
  
  public getGameProgress(): number {
    const filledCells = this._board.filter(cell => cell !== null).length;
    return (filledCells / this._boardSize) * 100;
  }
  
  // Переопределяем cleanup для специфичной очистки
  protected override _onCleanup(): void {
    super._onCleanup();
    this._board = [];
    this._symbols = {};
    this._winningLine = undefined;
  }
}
