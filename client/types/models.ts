/**
 * @fileoverview TypeScript типы для новых моделей (Tournament, MediaDerivative, Session)
 */

// ===== TOURNAMENT TYPES =====

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  type: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  status: 'preparing' | 'registering' | 'active' | 'completed' | 'cancelled';
  max_participants: number;
  entry_fee_coins: number;
  prize_pool: number;
  start_date?: Date | string;
  end_date?: Date | string;
  creator_id?: string;
  metadata: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Ассоциации
  Creator?: Pick<User, 'id' | 'display_name' | 'first_name'>;
  Participants?: GameParticipant[];
  GameRooms?: GameRoom[];
  Transactions?: Transaction[];
}

export interface CreateTournamentData {
  name: string;
  description?: string;
  type?: Tournament['type'];
  max_participants?: number;
  entry_fee_coins?: number;
  prize_pool?: number;
  start_date?: Date | string;
  end_date?: Date | string;
  metadata?: Record<string, any>;
}

export interface TournamentStats {
  totalParticipants: number;
  registrationStatus: 'open' | 'full' | 'closed';
  timeToStart?: number; // minutes
  estimatedDuration?: number; // minutes
}

// ===== MEDIA DERIVATIVE TYPES =====

export interface MediaDerivative {
  id: string;
  source_media_id: string;
  derivative_type: 'thumbnail' | 'preview' | 'optimized' | 'webp' | 'blur_hash' | 'low_quality';
  file_path: string;
  size_bytes: number;
  width?: number;
  height?: number;
  format: string;
  quality?: number;
  metadata: Record<string, any>;
  created_at: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Ассоциации
  SourceMedia?: Media;
}

export interface CreateMediaDerivativeOptions {
  size_bytes?: number;
  width?: number;
  height?: number;
  format?: string;
  quality?: number;
  metadata?: Record<string, any>;
}

export interface MediaDerivativeDisplayInfo {
  id: string;
  type: MediaDerivative['derivative_type'];
  format: string;
  size: string;
  dimensions: string | null;
  quality?: number;
  url: string;
  created: Date | string;
}

// ===== SESSION TYPES =====

export interface Session {
  id: string;
  pair_id: string;
  session_type: 'learning' | 'gaming' | 'discussion' | 'exercise' | 'meditation' | 'planning' | 'date' | 'activity';
  title: string;
  description?: string;
  started_at: Date | string;
  ended_at?: Date | string;
  duration_minutes?: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  quality_rating?: number; // 1-10
  participants: string[]; // user IDs
  goals: SessionGoal[];
  achievements: SessionAchievement[];
  notes?: string;
  metadata: Record<string, any>;
  created_by_user_id?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Ассоциации
  Pair?: Pair;
  Creator?: Pick<User, 'id' | 'display_name' | 'first_name'>;
}

export interface SessionGoal {
  id?: string;
  title: string;
  description?: string;
  completed?: boolean;
  completed_at?: Date | string;
}

export interface SessionAchievement {
  type: string;
  title: string;
  description?: string;
  earned_at: Date | string;
  metadata?: Record<string, any>;
}

export interface StartSessionData {
  session_type?: Session['session_type'];
  title: string;
  description?: string;
  participants?: string[];
  goals?: SessionGoal[];
  metadata?: Record<string, any>;
}

export interface CompleteSessionData {
  quality_rating?: number;
  achievements?: SessionAchievement[];
  notes?: string;
}

export interface SessionDisplayInfo {
  id: string;
  title: string;
  type: Session['session_type'];
  status: Session['status'];
  duration: number; // minutes
  rating?: number;
  goals: number;
  achievements: number;
  started: Date | string;
  ended?: Date | string;
}

export interface SessionStats {
  timeframe: 'week' | 'month' | 'year';
  totalSessions: number;
  totalMinutes: number;
  averageRating: string | null;
  typeStats: Record<string, {
    count: number;
    minutes: number;
    averageRating: string | null;
  }>;
  period: {
    from: Date | string;
    to: Date | string;
  };
}

// ===== UPDATED COMMON TYPES =====

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  locale?: string;
  email_verified: boolean;
  bio?: string;
  avatarUrl?: string;
  googleId?: string;
  role?: string;
  coins?: number;
  total_login_days?: number;
  preferences?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Pair {
  id: string;
  user1Id?: string;
  user2Id?: string;
  name?: string;
  harmony_index: number;
  metadata: Record<string, any>;
  isAccepted?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Ассоциации (обновленные)
  User1?: User;
  User2?: User;
  UserPairs?: UserPair[];
  Events?: Event[];
  Media?: Media[];
  GameRooms?: GameRoom[];
  Transactions?: Transaction[];
  Gifts?: Gift[];
  Insights?: Insight[];
  LessonProgress?: UserLessonProgress[];
  Achievements?: Achievement[];
  Sessions?: Session[];
}

export interface UserPair {
  id: string;
  user_id: string;
  pair_id: string;
  role: 'member' | 'admin';
  accepted: boolean;
  joined_at: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Ассоциации
  User?: User;
  Pair?: Pair;
}

export interface GameParticipant {
  id: string;
  game_room_id?: string;
  tournament_id?: string;
  user_id: string;
  is_host: boolean;
  stats: Record<string, any>;
  joined_at: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Ассоциации
  GameRoom?: GameRoom;
  Tournament?: Tournament;
  User?: User;
}

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
  gameFormat?: string;
  settings?: Record<string, any>;
  state: string;
  pair_id?: string;
  tournament_id?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Ассоциации (обновленные)
  Host?: User;
  Pair?: Pair;
  Tournament?: Tournament;
  Participants?: GameParticipant[];
}

export interface Transaction {
  id: string;
  pair_id?: string;
  user_id?: string;
  tournament_id?: string;
  tx_type: 'credit' | 'debit' | 'purchase' | 'refund' | 'bonus' | 'penalty' | 'tournament_entry' | 'tournament_prize';
  amount: number;
  currency: string;
  metadata: Record<string, any>;
  created_at: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Ассоциации
  Pair?: Pair;
  User?: User;
  Tournament?: Tournament;
}

export interface Achievement {
  id: string;
  pair_id: string;
  user_id?: string;
  type: string;
  category: string;
  title: string;
  description?: string;
  icon?: string;
  rarity: string;
  points: number;
  earned_at: Date | string;
  metadata: Record<string, any>;
  is_hidden: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Ассоциации
  Pair?: Pair;
  User?: User;
}

export interface Media {
  id: string;
  eventId: string;
  pair_id?: string;
  uploaded_by?: string;
  file_url: string;
  file_type: 'image' | 'video';
  size_bytes?: number;
  blurhash?: string;
  mime_type?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Ассоциации (обновленные)
  Event?: Event;
  Pair?: Pair;
  UploadedBy?: User;
  Derivatives?: MediaDerivative[];
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: Date | string;
  end_date?: Date | string;
  event_type: 'memory' | 'plan' | 'anniversary' | 'birthday' | 'travel' | 'date' | 'gift' | 'milestone';
  isShared: boolean;
  is_recurring: boolean;
  recurrence_rule?: Record<string, any>;
  parent_event_id?: string;
  visibility: string;
  userId: string;
  pair_id?: string;
  creator_user_id?: string;
  metadata: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Ассоциации (обновленные)
  User?: User;
  Pair?: Pair;
  CreatorUser?: User;
  Media?: Media[];
}

// ===== API RESPONSE TYPES =====

export interface TournamentResponse {
  tournament: Tournament;
  stats?: TournamentStats;
  userRegistered?: boolean;
}

export interface SessionResponse {
  session: Session;
  canModify?: boolean;
}

export interface MediaDerivativeResponse {
  derivatives: MediaDerivative[];
  sourceMedia?: Media;
}

// ===== FILTER & QUERY TYPES =====

export interface TournamentFilters {
  status?: Tournament['status'];
  type?: Tournament['type'];
  entry_fee_max?: number;
  has_space?: boolean;
}

export interface SessionFilters {
  session_type?: Session['session_type'];
  status?: Session['status'];
  from_date?: Date | string;
  to_date?: Date | string;
}

export interface MediaDerivativeFilters {
  derivative_type?: MediaDerivative['derivative_type'];
  format?: string;
  min_size?: number;
  max_size?: number;
}
