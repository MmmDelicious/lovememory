import { TurnBasedGame } from '../base/TurnBasedGame';
import { GameTypes, IGameSettings } from '../../types/game.interfaces';

// Специфичные типы для игры Memory
interface IMemoryCard {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  position: number;
}

interface IMemoryState extends GameTypes.ITurnBasedState {
  cards: IMemoryCard[];
  flippedCards: number[];
  matchedPairs: string[];
  scores: Record<string, number>;
  moves: Record<string, number>;
  difficulty: 'easy' | 'medium' | 'hard';
  totalPairs: number;
  gameStartTime: Date;
}

interface IMemoryMove {
  cardId: number;
}

interface IMemorySettings extends IGameSettings {
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * Новая реализация игры Memory на основе TurnBasedGame
 * Поддерживает разные уровни сложности и автоматическое управление ходами
 */
export class MemoryGameNew extends TurnBasedGame<IMemoryState, IMemoryMove> {
  public readonly gameType = 'memory';
  
  // Игровые данные
  private _cards: IMemoryCard[] = [];
  private _flippedCards: IMemoryCard[] = [];
  private _matchedPairs: string[] = [];
  private _scores: Record<string, number> = {};
  private _moves: Record<string, number> = {};
  private _difficulty: 'easy' | 'medium' | 'hard';
  private _gameStartTime?: Date;
  
  // Символы для карточек
  private readonly SYMBOLS = [
    '❤️', '🌟', '🎈', '🎨', '🎭', '🎪', '🎯', '🎲', 
    '🎮', '🎸', '🎹', '🎺', '🎻', '🎼', '🎵', '🎶', 
    '🎷', '🏀', '⚽', '🎾', '🏐', '🏈', '⚾', '🥎'
  ];
  
  constructor(roomId?: string, settings?: Partial<IMemorySettings>) {
    // Настройки для Memory
    const memorySettings: IMemorySettings = {
      maxPlayers: 2,
      minPlayers: 2,
      timeLimit: 30, // 30 секунд на выбор карточки
      difficulty: 'easy',
      ...settings
    };
    
    super(roomId, memorySettings);
    
    this._difficulty = memorySettings.difficulty!;
  }
  
  // Реализация абстрактных методов TurnBasedGame
  protected _executeMove(playerId: string, move: IMemoryMove): void {
    const { cardId } = move;
    
    // Находим карточку
    const card = this._cards.find(c => c.id === cardId);
    if (!card) {
      throw new Error('Card not found');
    }
    
    // Проверяем, что карточка доступна для переворота
    if (card.isMatched || card.isFlipped) {
      throw new Error('Card is not available');
    }
    
    // Проверяем лимит открытых карточек (максимум 2 за ход)
    if (this._flippedCards.length >= 2) {
      throw new Error('Already have 2 cards flipped');
    }
    
    // Переворачиваем карточку
    card.isFlipped = true;
    this._flippedCards.push(card);
    
    this._emitEvent({
      type: 'card_flipped',
      playerId,
      data: { cardId, value: card.value, flippedCount: this._flippedCards.length },
      timestamp: new Date()
    });
    
    // Если открыты 2 карточки, проверяем совпадение
    if (this._flippedCards.length === 2) {
      this._processTwoCards(playerId);
    }
  }
  
  protected _checkGameEnd(): boolean {
    // Игра заканчивается, когда все пары найдены
    return this._matchedPairs.length === this._getCardPairs().length / 2;
  }
  
  protected _determineWinner(): string | 'draw' | null {
    if (this._players.length === 0) return null;
    
    // Создаем массив с результатами игроков
    const playerResults = this._players.map(player => ({
      id: player.id,
      score: this._scores[player.id] || 0,
      moves: this._moves[player.id] || 0
    }));
    
    // Сортируем по очкам (больше лучше), затем по ходам (меньше лучше)
    playerResults.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.moves - b.moves;
    });
    
    // Проверяем на ничью
    if (playerResults.length >= 2 && 
        playerResults[0].score === playerResults[1].score &&
        playerResults[0].moves === playerResults[1].moves) {
      return 'draw';
    }
    
    return playerResults[0].id;
  }
  
  // Реализация валидации ходов
  public isValidMove(playerId: string, move: IMemoryMove): boolean {
    try {
      this._validatePlayerMove(playerId);
      this._validateTurn(playerId);
      
      const { cardId } = move;
      
      // Проверяем, что карточка существует
      const card = this._cards.find(c => c.id === cardId);
      if (!card) return false;
      
      // Проверяем, что карточка доступна
      if (card.isMatched || card.isFlipped) return false;
      
      // Проверяем лимит открытых карточек
      if (this._flippedCards.length >= 2) return false;
      
      return true;
    } catch {
      return false;
    }
  }
  
  public getValidMoves(playerId: string): IMemoryMove[] {
    if (!this._isPlayerInGame(playerId) || this.currentPlayerId !== playerId) {
      return [];
    }
    
    // Если уже открыты 2 карточки, нет доступных ходов
    if (this._flippedCards.length >= 2) {
      return [];
    }
    
    const validMoves: IMemoryMove[] = [];
    
    for (const card of this._cards) {
      if (!card.isMatched && !card.isFlipped) {
        validMoves.push({ cardId: card.id });
      }
    }
    
    return validMoves;
  }
  
  // Совместимость со старым API - flipCard метод
  public flipCard(playerId: string, move: IMemoryMove | any): IMemoryState {
    // Адаптируем разные форматы данных
    let normalizedMove: IMemoryMove;
    
    if (typeof move === 'object' && move.cardId !== undefined) {
      normalizedMove = move;
    } else if (typeof move === 'object' && move.action && move.value !== undefined) {
      // Старый формат {action, value}
      normalizedMove = { cardId: move.value };
    } else if (typeof move === 'number') {
      // Прямое число - cardId
      normalizedMove = { cardId: move };
    } else {
      throw new Error('Invalid move format for Memory game');
    }
    
    console.log(`🃏 [MEMORY GAME] flipCard called`, {
      playerId,
      originalMove: move,
      normalizedMove,
      currentPlayer: this.currentPlayerId
    });
    
    return this.makeMove(playerId, normalizedMove);
  }
  
  // Переопределяем getState для специфичных данных Memory
  public getState(): IMemoryState {
    return {
      ...this._getTurnBasedState(),
      cards: this._cards.map(card => ({
        id: card.id,
        value: card.isFlipped || card.isMatched ? card.value : '?',
        isFlipped: card.isFlipped,
        isMatched: card.isMatched,
        position: card.position
      })),
      flippedCards: this._flippedCards.map(card => card.id),
      matchedPairs: [...this._matchedPairs],
      scores: { ...this._scores },
      moves: { ...this._moves },
      difficulty: this._difficulty,
      totalPairs: this._getCardPairs().length / 2,
      gameStartTime: this._gameStartTime || new Date()
    };
  }
  
  // Переопределяем инициализацию игры
  protected _initializeGame(): void {
    // Инициализируем счетчики для игроков
    this._scores = {};
    this._moves = {};
    
    for (const player of this._players) {
      this._scores[player.id] = 0;
      this._moves[player.id] = 0;
    }
    
    // Инициализируем карточки
    this._initializeCards();
    
    // Сбрасываем игровое состояние
    this._flippedCards = [];
    this._matchedPairs = [];
    this._gameStartTime = new Date();
    
    super._initializeGame();
    
    this._emitEvent({
      type: 'memory_game_initialized',
      data: {
        difficulty: this._difficulty,
        totalCards: this._cards.length,
        totalPairs: this._cards.length / 2,
        gameStartTime: this._gameStartTime
      },
      timestamp: new Date()
    });
  }
  
  // Переопределяем переход хода
  protected _nextTurn(): void {
    // Очищаем открытые карточки перед переходом хода
    this._clearFlippedCards();
    super._nextTurn();
  }
  
  // Переопределяем обработку таймаута
  protected _handleDefaultMove(playerId: string): void {
    // При таймауте открываем случайную доступную карточку
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
  private _initializeCards(): void {
    const cardPairs = this._getCardPairs();
    
    this._cards = cardPairs.map((symbol, index) => ({
      id: index,
      value: symbol,
      isFlipped: false,
      isMatched: false,
      position: index
    }));
    
    this._shuffleCards();
  }
  
  private _getCardPairs(): string[] {
    let pairCount: number;
    
    switch (this._difficulty) {
      case 'easy':
        pairCount = 12; // 6x4 grid
        break;
      case 'medium':
        pairCount = 18; // 6x6 grid  
        break;
      case 'hard':
        pairCount = 24; // 8x6 grid
        break;
      default:
        pairCount = 12;
    }
    
    const selectedSymbols = this.SYMBOLS.slice(0, pairCount);
    return [...selectedSymbols, ...selectedSymbols]; // Дублируем для пар
  }
  
  private _shuffleCards(): void {
    for (let i = this._cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
    }
  }
  
  private _processTwoCards(playerId: string): void {
    // Увеличиваем счетчик ходов
    this._moves[playerId] = (this._moves[playerId] || 0) + 1;
    
    const [card1, card2] = this._flippedCards;
    
    if (card1.value === card2.value) {
      // Совпадение найдено!
      card1.isMatched = true;
      card2.isMatched = true;
      this._matchedPairs.push(card1.value);
      this._scores[playerId] = (this._scores[playerId] || 0) + 10;
      
      this._emitEvent({
        type: 'match_found',
        playerId,
        data: { 
          symbol: card1.value, 
          cards: [card1.id, card2.id],
          newScore: this._scores[playerId],
          totalMatches: this._matchedPairs.length 
        },
        timestamp: new Date()
      });
      
      // Очищаем открытые карточки
      this._flippedCards = [];
      
      // Игрок продолжает ход при совпадении (не вызываем _nextTurn)
      
    } else {
      // Совпадения нет
      this._emitEvent({
        type: 'no_match',
        playerId,
        data: { 
          cards: [card1.id, card2.id],
          values: [card1.value, card2.value]
        },
        timestamp: new Date()
      });
      
      // Карточки остаются открытыми до следующего хода для показа игрокам
      // Они будут закрыты в _nextTurn()
    }
  }
  
  private _clearFlippedCards(): void {
    // Закрываем карточки, которые не совпали
    for (const card of this._flippedCards) {
      if (!card.isMatched) {
        card.isFlipped = false;
      }
    }
    
    this._flippedCards = [];
  }
  
  // Утилитарные методы
  public getGridLayout(): { cols: number; rows: number } {
    switch (this._difficulty) {
      case 'easy':
        return { cols: 6, rows: 4 };
      case 'medium':
        return { cols: 6, rows: 6 };
      case 'hard':
        return { cols: 8, rows: 6 };
      default:
        return { cols: 6, rows: 4 };
    }
  }
  
  public getGameProgress(): number {
    const totalPairs = this._getCardPairs().length / 2;
    return (this._matchedPairs.length / totalPairs) * 100;
  }
  
  public getPlayerStats(playerId: string): { score: number; moves: number; accuracy: number } {
    const score = this._scores[playerId] || 0;
    const moves = this._moves[playerId] || 0;
    const matches = score / 10; // Каждое совпадение = 10 очков
    const accuracy = moves > 0 ? (matches / moves) * 100 : 0;
    
    return { score, moves, accuracy };
  }
  
  public getRemainingPairs(): number {
    const totalPairs = this._getCardPairs().length / 2;
    return totalPairs - this._matchedPairs.length;
  }

  
  public getGameState(): any {
    return this.getState();
  }

  // Переопределяем setPlayerReady для обратной совместимости
  public override setPlayerReady(playerId: string, ready: boolean = true): IMemoryState {
    try {
      // Вызываем базовую реализацию
      const result = super.setPlayerReady(playerId, ready);
      return result;
    } catch (error) {
      console.error(`[MemoryGame] Error setting player ready:`, error);
      return this.getState();
    }
  }
  
  // Переопределяем очистку
  protected _onCleanup(): void {
    super._onCleanup();
    this._cards = [];
    this._flippedCards = [];
    this._matchedPairs = [];
    this._scores = {};
    this._moves = {};
  }
}
