/**
 * Games domain types
 */

export type GameType = 'memory' | 'chess' | 'poker' | 'quiz' | 'wordle' | 'tic-tac-toe' | 'codenames'

export interface GameRoom {
  id: string
  name: string
  gameType: GameType
  hostId: string
  players: Player[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  settings: GameSettings
  createdAt: string
  updatedAt: string
}

export interface Player {
  id: string
  userId: string
  username: string
  avatar?: string
  isHost: boolean
  isReady: boolean
  score?: number
}

export interface GameSettings {
  difficulty?: 'easy' | 'medium' | 'hard'
  timeLimit?: number
  rounds?: number
  private?: boolean
  [key: string]: any
}

export interface CreateRoomRequest {
  name: string
  gameType: GameType
  maxPlayers?: number
  settings?: Partial<GameSettings>
}

export interface Tournament {
  id: string
  name: string
  gameType: GameType
  status: 'upcoming' | 'active' | 'finished'
  startDate: string
  endDate?: string
  participants: TournamentParticipant[]
  prizes?: string[]
  rules?: string
  createdAt: string
}

export interface TournamentParticipant {
  id: string
  userId: string
  username: string
  avatar?: string
  score: number
  rank?: number
}
