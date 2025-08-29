/**
 * @fileoverview TypeScript типы для игровой системы клиента
 */

// Базовые типы игрока
export interface Player {
    id: string;
    name: string;
    gender: 'male' | 'female' | 'other';
    avatarUrl?: string;
  }
  
  // Базовое состояние игры (generic для состава players)
  export interface BaseGameState<TPlayers = string[]> {
    gameType: string;
    status: 'waiting' | 'in_progress' | 'finished';
    players: TPlayers;
    currentPlayerId: string | null;
    winner: string | 'draw' | null;
    isDraw: boolean;
  }
  
  // Карта для покера
  export interface Card {
    rank: string; // '2'-'9', 'T', 'J', 'Q', 'K', 'A'
    suit: 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades
  }
  
  // Игрок в покере
  export interface PokerPlayer extends Player {
    stack: number;
    hand: Card[];
    cards: Card[]; // Для совместимости
    currentBet: number;
    inHand: boolean;
    hasActed: boolean;
    isWaitingToPlay: boolean;
    isAllIn: boolean;
    hasBoughtIn: boolean;
    showCards: boolean;
  }
  
  // Информация о победителе в покере
  export interface WinnerInfo {
    player: PokerPlayer;
    handName: string;
    handCards: Card[];
    pot: number;
  }
  
  // Состояние покерной игры
  export interface PokerGameState extends BaseGameState<PokerPlayer[]> {
    stage: 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';
    pot: number;
    communityCards: Card[];
    winnersInfo: WinnerInfo[] | null;
    
    // Персональные данные игрока
    yourHand: Card[];
    yourStack: number;
    yourCurrentBet: number;
    isObserving: boolean;
    canMakeAction: boolean;
    validActions: string[];
    minRaiseAmount: number;
    maxRaiseAmount: number;
    callAmount: number;
    initialBuyIn?: number;
    winningHandCards: Card[];
    visibleHands: Array<{ playerId: string; hand: Card[] }>;
    
    // Дополнительные поля для покера
    needsBuyIn?: boolean;
    hasBoughtIn?: boolean;
    showdownPhase?: boolean;
    playersToShow?: string[];
    currentShowdownPlayer?: string | null;
    showdownOrder?: string[] | null;
  }
  
  // Вопрос для квиза
  export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    questionNumber?: number;
    totalQuestions?: number;
    timeRemaining?: number;
  }
  
  // Состояние квиза
  export interface QuizGameState extends BaseGameState {
    scores: Record<string, number>;
    currentQuestionIndex: number;
    currentQuestion: QuizQuestion | null;
    playerAnswers: Record<string, Record<number, number>>;
    totalQuestions: number;
  }
  
  // Состояние шахмат
  export interface ChessGameState extends BaseGameState {
    board: Record<string, string>;
    turn: 'w' | 'b';
    moveHistory: string[];
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
  
  // Состояние крестиков-ноликов
  export interface TicTacToeGameState extends BaseGameState {
    board: (string | null)[];
    symbols: Record<string, 'X' | 'O'>;
  }

  // Карта Codenames
  export interface CodenamesCard {
    id: number;
    word: string;
    type: 'red' | 'blue' | 'neutral' | 'assassin' | null;
    revealed: boolean;
  }

  // Команда в Codenames
  export interface CodenamesTeam {
    captain: string;
    player: string;
    name: string;
    color: string;
  }

  // Роль игрока в Codenames
  export interface CodenamesPlayerRole {
    team: 'team1' | 'team2';
    role: 'captain' | 'player';
  }

  // Прогресс команды в Codenames
  export interface CodenamesTeamProgress {
    total: number;
    revealed: number;
  }

  // Запись в истории игры Codenames
  export interface CodenamesHistoryEntry {
    type: 'clue' | 'guess' | 'pass';
    team: 'team1' | 'team2';
    player: string;
    clue?: string;
    number?: number;
    cardId?: number;
    word?: string;
    cardType?: string;
    timestamp: string;
  }

  // Состояние игры Codenames
  export interface CodenamesGameState extends BaseGameState {
    currentTeam: 'team1' | 'team2';
    currentPhase: 'giving_clue' | 'guessing';
    currentPlayer: string;
    teams: Record<string, CodenamesTeam>;
    board: CodenamesCard[];
    currentClue: string | null;
    currentClueNumber: number;
    guessesLeft: number;
    canPass: boolean;
    teamProgress: Record<string, CodenamesTeamProgress>;
    gameHistory: CodenamesHistoryEntry[];
    playerRole: CodenamesPlayerRole;
  }

  // Ход в Codenames
  export interface CodenamesMove {
    type: 'give_clue' | 'guess' | 'pass';
    clueWord?: string;
    clueNumber?: number;
    cardId?: number;
  }
  
  // Объединенный тип состояния игры
  export type GameState = PokerGameState | QuizGameState | ChessGameState | TicTacToeGameState | CodenamesGameState;
  
  // Типы ходов
  export interface ChessMove {
    from: string;
    to: string;
    promotion?: 'q' | 'r' | 'b' | 'n';
  }
  
  export interface ChessAction {
    action: 'offer_draw' | 'accept_draw' | 'decline_draw' | 'resign' | 'pause' | 'request_undo';
  }
  
  export type ChessMoveOrAction = ChessMove | ChessAction;
  
  export interface PokerMove {
    action: 'fold' | 'check' | 'call' | 'raise' | 'bet';
    value?: number;
  }
  
  export type GameMove = ChessMoveOrAction | PokerMove | CodenamesMove | number; // number для TicTacToe и Quiz
  
  // Комната игры
  export interface GameRoom {
    id: string;
    gameType: string;
    status: 'waiting' | 'in_progress' | 'finished';
    bet: number;
    tableType?: string;
    blinds?: string;
    maxPlayers: number;
    hostId: string;
    players: string[];
    playerCount: number;
    Host?: {
      id: string;
      first_name: string;
    };
  }
  
  // Конфигурация игры
  export interface GameConfig {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: React.ComponentType<any>;
    minPlayers: number;
    maxPlayers: number;
    difficulty: string;
    players: string;
    minBet: number;
    maxBet: number;
    defaultBet: number;
  }
  
  // Пропсы для игровых компонентов
  export interface GameComponentProps {
    gameState: GameState;
    user: { id: string; email: string };
    makeMove: (move: GameMove) => void;
    token: string;
    roomId: string;
  }
  
  // Пропсы для покерного стола
  export interface PokerTableProps {
    gameState: PokerGameState;
    onAction: (action: string, value?: number) => void;
    onRebuy: () => void;
    userId: string;
  }
  
  // Пропсы для игрока в покере
  export interface PlayerProps {
    player: PokerPlayer;
    isMainPlayer?: boolean;
    showCards?: boolean;
    isActive?: boolean;
    isWinner?: boolean;
    dealingPhase?: boolean;
    yourHand?: Card[];
    isWinningCard?: (card: Card) => boolean;
    hasBoughtIn?: boolean;
  }
  
  // Пропсы для игральной карты
  export interface PlayingCardProps {
    suit?: 'H' | 'D' | 'C' | 'S';
    rank?: string;
    faceUp?: boolean;
    isWinning?: boolean;
    isCommunity?: boolean;
  }
  
  // Хуки
  export interface UseGameSocketReturn {
    gameState: GameState | null;
    isConnected: boolean;
    makeMove: (move: GameMove) => void;
  }
  
  export interface UseGameLobbyReturn {
    rooms: GameRoom[];
    isLoading: boolean;
    error: string | null;
    createRoom: (formData: any) => Promise<GameRoom>;
    refreshRooms: () => void;
  }
  
  // Валидация
  export interface ValidationResult {
    isValid: boolean;
    errors: string[];
  }
  
  // Экономические типы
  export interface EconomicConfig {
    winnerBonusPercent: number;
    minimumBet: number;
    maximumBet: number;
    defaultCoins: number;
  }