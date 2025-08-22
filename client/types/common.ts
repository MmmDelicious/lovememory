// Общие типы для приложения

export interface APIResponse<T = any> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DateOption {
  id: string;
  title: string;
  activity: PlaceActivity;
  restaurant: Restaurant;
  schedule: DateScheduleItem[];
  reasoning: string;
  estimatedCost: number;
  duration: number;
  atmosphere: 'romantic' | 'fun' | 'active' | 'relaxed' | 'cultural';
}

export interface DateScheduleItem {
  time: string;
  endTime: string;
  activity: string;
  description: string;
}

export interface PlaceActivity {
  id: string;
  name: string;
  description?: string;
  address: string;
  coordinates: Coordinates;
  rating?: number;
  priceLevel?: number;
  type: string;
  photos?: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine?: string;
  address: string;
  coordinates: Coordinates;
  rating?: number;
  priceLevel?: number;
  photos?: string[];
  description?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GameRoom {
  id: string;
  name: string;
  gameType: string;
  maxPlayers: number;
  currentPlayers: number;
  host: User;
  status: 'waiting' | 'in_progress' | 'finished';
  bet?: number;
  settings?: Record<string, any>;
}

export interface GameState {
  status: 'waiting' | 'in_progress' | 'finished';
  players: Player[];
  currentPlayerId?: string;
  winner?: string | Player;
  board?: Record<string, string>;
  // Poker specific
  pot?: number;
  communityCards?: Card[];
  stage?: 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';
  validActions?: string[];
  minRaiseAmount?: number;
  maxRaiseAmount?: number;
  callAmount?: number;
  winningHandCards?: number[];
  yourHand?: Card[];
  winnersInfo?: any[];
  showdownPhase?: boolean;
  playersToShow?: any[];
  currentShowdownPlayer?: string | null;
  showdownOrder?: any;
  needsBuyIn?: boolean;
  hasBoughtIn?: boolean;
  // Wordle specific
  targetWord?: string;
  guesses?: string[];
  playerState?: any;
  opponentState?: any;
  // Chess specific
  fen?: string;
  capturedPieces?: { white: string[]; black: string[] };
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  avatarUrl?: string;
  coins: number;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  stack?: number;
  currentBet?: number;
  inHand?: boolean;
  hand?: Card[];
  isReady?: boolean;
  score?: number;
  showCards?: boolean;
  gender?: 'male' | 'female' | 'other';
}

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'H' | 'D' | 'C' | 'S';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'T';
}

export interface Lesson {
  id: string;
  title: string;
  text: string;
  description?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration?: number;
  content?: LessonContent;
  triggers?: LessonTrigger[];
  effects?: LessonEffect[];
  isActive?: boolean;
  tags?: string[];
  interactive_type?: 'prompt' | 'quiz' | 'chat' | 'photo' | 'choice';
  animation_file?: string;
  base_coins_reward?: number;
  streak_bonus?: number;
  theme?: string;
  difficulty_level?: number;
  required_streak?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Поддержка вложенной структуры для совместимости
  Lesson?: {
    title: string;
    text: string;
    tags: string[];
    interactive_type: 'prompt' | 'quiz' | 'chat' | 'photo' | 'choice';
    animation_file?: string;
    base_coins_reward: number;
    streak_bonus?: number;
  };
}

export interface LessonContent {
  introduction: string;
  mainContent: string;
  practicalTask?: string;
  reflection?: string;
  resources?: string[];
}

export interface LessonTrigger {
  type: string;
  condition: string;
  value: any;
}

export interface LessonEffect {
  metricType: string;
  value: number;
  description: string;
}

export interface RelationshipMetrics {
  communicationScore: number;
  intimacyScore: number;
  conflictResolutionScore: number;
  sharedActivitiesScore: number;
  trustScore: number;
  supportScore: number;
  overallScore: number;
  lastUpdated: string;
}

export interface LessonProgress {
  userId: string;
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  feedback?: LessonFeedback;
}

export interface LessonFeedback {
  rating: number;
  difficulty: number;
  helpfulness: number;
  comments?: string;
}
