// Типы для покерной игры

export type PokerStage = 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';
export type PlayerStatus = 'playing' | 'folded' | 'all-in' | 'waiting' | 'busted' | 'observer';
export type PokerAction = 'fold' | 'check' | 'call' | 'raise' | 'bet' | 'show' | 'muck' | 'all-in';

export interface PokerCard {
  rank: string; // '2'-'9', 'T', 'J', 'Q', 'K', 'A'
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
}

export interface PokerPlayer {
  id: string;
  name: string;
  seat: number;
  stack: number;
  holeCards: PokerCard[];
  currentBet: number;
  totalBetThisHand: number;
  status: PlayerStatus;
  hasActed: boolean;
  lastAction?: PokerAction;
  showCards: boolean;
  hasBoughtIn: boolean;
  
  // Дополнительные поля для GameFlow
  isDealer?: boolean;
  isSmallBlind?: boolean;
  isBigBlind?: boolean;
}

export interface PokerSettings {
  smallBlind: number;
  bigBlind: number;
  buyInAmount: number;
  maxPlayers: number;
  minPlayers: number;
  turnTimeLimit: number;
  allowRebuys: boolean;
  allowAddOns: boolean;
  minBuyIn?: number;
  maxBuyIn?: number;
}

export interface GameState {
  gameId: string;
  stage: PokerStage;
  communityCards: PokerCard[];
  pot: number;
  sidePots: SidePot[];
  dealerSeat: number;
  currentTurnSeat: number;
  lastBetSize: number;
  minRaiseAmount: number;
  activePlayers: string[];
  players?: PokerPlayer[]; // Для совместимости
  isHandActive: boolean;
  handNumber: number;
}

export interface PlayerAction {
  playerId: string;
  action: PokerAction;
  amount?: number;
  timestamp: Date;
}

export interface PlayerGameState {
  gameId: string;
  stage: PokerStage;
  communityCards: PokerCard[];
  pot: number;
  sidePots: SidePot[];
  dealerSeat: number;
  currentTurnSeat: number;
  lastBetSize: number;
  minRaiseAmount: number;
  activePlayers: string[];
  players: PokerPlayer[];
  isHandActive: boolean;
  handNumber: number;
  
  // Данные конкретного игрока
  yourCards: PokerCard[];
  validActions: PokerAction[];
  callAmount: number;
  maxRaiseAmount: number;
  timeToAct?: number;
  needsBuyIn?: boolean;
  hasBoughtIn?: boolean;
  minBuyIn?: number;
  maxBuyIn?: number;
}

export interface SidePot {
  id?: string;
  amount: number;
  eligiblePlayers: string[];
}

export interface PotDistribution {
  potId?: string;
  amount: number;
  winners: HandResult[];
  sidePots: SidePot[];
}

export interface HandResult {
  player: PokerPlayer;
  playerId?: string; // Для совместимости
  handRank: number;
  handName: string;
  cards: PokerCard[];
  hand?: any; // Для совместимости с pokersolver
  amount: number;
  eligiblePots?: string[]; // Для совместимости
}

export interface PokerEventData {
  type: string;
  data: any;
  timestamp: Date;
}
