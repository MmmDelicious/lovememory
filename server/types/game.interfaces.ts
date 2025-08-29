/**
 * Базовые интерфейсы для игровой архитектуры
 */

// Базовые типы
export type GameStatus = 'waiting' | 'in_progress' | 'finished' | 'paused';
export type PlayerRole = 'player' | 'captain' | 'spectator';

// Интерфейс игрока
export interface IPlayer {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  ready?: boolean;
  isBot?: boolean;
  isObserver?: boolean; // Игрок в режиме наблюдателя
}

// Интерфейс команды (для командных игр)
export interface ITeam {
  id: string;
  name: string;
  color?: string;
  players: IPlayer[];
  captain?: string;
  score?: number;
}

// Базовый интерфейс состояния игры
export interface IGameState {
  roomId?: string;
  gameType: string;
  status: GameStatus;
  players: IPlayer[];
  currentPlayerId?: string;
  winner?: string | 'draw' | null;
  createdAt?: Date;
  startedAt?: Date;
  finishedAt?: Date;
  lastMoveAt?: Date;
}

// Интерфейс для ходов в игре
export interface IGameMove {
  playerId: string;
  timestamp: Date;
  data: any; // Специфичные данные хода для каждой игры
}

// Интерфейс настроек игры
export interface IGameSettings {
  maxPlayers: number;
  minPlayers: number;
  timeLimit?: number; // в секундах
  difficulty?: 'easy' | 'medium' | 'hard';
  customSettings?: Record<string, any>;
}

// Интерфейс результатов игры
export interface IGameResult {
  gameId: string;
  gameType: string;
  winner: string | 'draw' | null;
  players: IPlayer[];
  score?: Record<string, number>;
  duration: number; // в миллисекундах
  moves: IGameMove[];
}

// Интерфейс для событий игры
export interface IGameEvent {
  type: string;
  playerId?: string;
  data?: any;
  timestamp: Date;
}

// Callback функции
export type StateChangeCallback = (state: IGameState) => void;
export type GameEventCallback = (event: IGameEvent) => void;

// Интерфейс для валидации ходов
export interface IMoveValidator<TMove> {
  isValidMove(gameState: IGameState, playerId: string, move: TMove): boolean;
  getValidMoves?(gameState: IGameState, playerId: string): TMove[];
}

// Интерфейс для подсчета очков
export interface IScoreCalculator {
  calculateScore(gameState: IGameState, playerId: string): number;
  calculateTeamScore?(gameState: IGameState, teamId: string): number;
}

// Интерфейс для таймеров
export interface IGameTimer {
  startTimer(duration: number, callback: () => void): void;
  stopTimer(): void;
  getRemainingTime(): number;
  isExpired(): boolean;
}

// Poker специфичные типы
export type PokerSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type PokerRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type PokerStage = 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';
export type PokerAction = 'fold' | 'call' | 'raise' | 'check' | 'bet' | 'muck' | 'show';

export interface IPokerCard {
  suit: PokerSuit;
  rank: PokerRank;
}

export interface IPokerPlayer extends IPlayer {
  stack: number;
  currentBet: number;
  inHand: boolean;
  hasActed: boolean;
  isWaitingToPlay: boolean;
  isAllIn: boolean;
  hasBoughtIn: boolean;
  showCards: boolean;
  hand: IPokerCard[];
  seat: number; // КРИТИЧНО: Номер места за столом для стабильности позиций
  isObserver?: boolean; // Игрок в режиме наблюдателя
}

export interface IPokerPot {
  amount: number;
  eligiblePlayers: string[]; // player IDs
}

export interface IPokerMove {
  action: PokerAction;
  amount?: number; // Для raise/bet
}

export interface IPokerSettings extends IGameSettings {
  smallBlind?: number;
  bigBlind?: number;
  buyInAmount?: number;
  turnTimeLimit?: number;
}

// Утилитарные типы для специфичных игр
export namespace GameTypes {
  // Для пошаговых игр
  export interface ITurnBasedState extends IGameState {
    currentPlayerId: string;
    turnStartTime?: Date;
    turnTimeLimit?: number;
    moveHistory: IGameMove[];
  }

  // Для командных игр  
  export interface ITeamGameState extends IGameState {
    teams: ITeam[];
    currentTeam?: string;
    teamScores: Record<string, number>;
  }

  // Для игр реального времени
  export interface IRealtimeGameState extends IGameState {
    gameStartTime: Date;
    timeRemaining?: number;
    simultaneousMoves?: boolean;
  }

  // Для карточных игр
  export interface ICardGameState extends IGameState {
    deck?: any[];
    hands?: Record<string, any[]>;
    communityCards?: any[];
    pot?: number;
  }

  // Для покера
  export interface IPokerState extends ITurnBasedState {
    stage: PokerStage;
    pot: number;
    sidePots: IPokerPot[];
    communityCards: IPokerCard[];
    dealerPosition: number;
    currentPlayerIndex: number;
    blinds: {
      small: number;
      big: number;
    };
    lastRaiser: string | null;
    lastRaiseAmount: number;
    showdownPhase: boolean;
    winnersInfo: any | null;
    players: IPokerPlayer[]; // Override base players with poker-specific
  }
}

// Абстрактный интерфейс для игры
export interface IGame<TState extends IGameState = IGameState, TMove = any> {
  // Основные свойства
  readonly gameType: string;
  readonly settings: IGameSettings;
  
  // Управление игроками
  addPlayer(player: IPlayer): TState;
  removePlayer(playerId: string): TState;
  getPlayer(playerId: string): IPlayer | null;
  
  // Управление игрой
  startGame(): TState;
  makeMove(playerId: string, move: TMove): TState;
  getState(): TState;
  isGameFinished(): boolean;
  
  // Валидация
  isValidMove(playerId: string, move: TMove): boolean;
  getValidMoves?(playerId: string): TMove[];
  
  // События и колбэки
  onStateChange?: StateChangeCallback;
  onGameEvent?: GameEventCallback;
  
  // Очистка ресурсов
  cleanup(): void;
}

// Мета-информация о типах игр
export interface IGameTypeInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  averageDuration: number; // в минутах
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export const GAME_TYPES_INFO: Record<string, IGameTypeInfo> = {
  'tic-tac-toe': {
    id: 'tic-tac-toe',
    name: 'Крестики-нолики',
    description: 'Классическая игра для двоих',
    category: 'logic',
    minPlayers: 2,
    maxPlayers: 2,
    averageDuration: 5,
    difficulty: 'easy',
    tags: ['быстрая', 'логика', 'классика']
  },
  'chess': {
    id: 'chess',
    name: 'Шахматы',
    description: 'Стратегическая битва умов',
    category: 'strategy',
    minPlayers: 2,
    maxPlayers: 2,
    averageDuration: 30,
    difficulty: 'hard',
    tags: ['стратегия', 'классика', 'мышление']
  },
  'memory': {
    id: 'memory',
    name: 'Мемори',
    description: 'Тренируйте память',
    category: 'memory',
    minPlayers: 2,
    maxPlayers: 4,
    averageDuration: 10,
    difficulty: 'easy',
    tags: ['память', 'концентрация', 'быстрая']
  },
  'poker': {
    id: 'poker',
    name: 'Покер',
    description: 'Карточная игра на мастерство',
    category: 'cards',
    minPlayers: 2,
    maxPlayers: 6,
    averageDuration: 45,
    difficulty: 'hard',
    tags: ['карты', 'блеф', 'стратегия']
  },
  'quiz': {
    id: 'quiz',
    name: 'Квиз',
    description: 'Проверьте свои знания',
    category: 'trivia',
    minPlayers: 2,
    maxPlayers: 4,
    averageDuration: 15,
    difficulty: 'medium',
    tags: ['знания', 'эрудиция', 'викторина']
  },
  'wordle': {
    id: 'wordle',
    name: 'Wordle',
    description: 'Угадайте слово за 6 попыток',
    category: 'word',
    minPlayers: 1,
    maxPlayers: 4,
    averageDuration: 10,
    difficulty: 'medium',
    tags: ['слова', 'логика', 'угадайка']
  },
  'codenames': {
    id: 'codenames',
    name: 'Codenames',
    description: 'Командная игра на ассоциации',
    category: 'team',
    minPlayers: 4,
    maxPlayers: 4,
    averageDuration: 20,
    difficulty: 'medium',
    tags: ['команда', 'ассоциации', 'творчество']
  }
};
