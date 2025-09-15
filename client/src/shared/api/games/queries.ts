/**
 * Games API queries and mutations
 */
import { apiClient } from '../client'
import type {
  GameRoom,
  CreateRoomRequest,
  Tournament,
  GameType
} from './types'

const GAMES_ENDPOINTS = {
  ROOMS: '/games',
  ROOM: '/games/room',
  TOURNAMENTS: '/tournaments',
  TOURNAMENT: (id: string) => `/tournaments/${id}`,
  JOIN_TOURNAMENT: (id: string) => `/tournaments/${id}/join`,
  LEAVE_TOURNAMENT: (id: string) => `/tournaments/${id}/leave`,
} as const

export class GamesAPI {
  /**
   * Get available game rooms
   */
  async getRooms(gameType?: GameType): Promise<GameRoom[]> {
    const params = gameType ? { gameType } : undefined
    return apiClient.get<GameRoom[]>(GAMES_ENDPOINTS.ROOMS, { params })
  }

  /**
   * Create new game room
   */
  async createRoom(roomData: CreateRoomRequest): Promise<GameRoom> {
    return apiClient.post<GameRoom>(GAMES_ENDPOINTS.ROOM, roomData)
  }

  /**
   * Join game room
   */
  async joinRoom(roomId: string): Promise<GameRoom> {
    return apiClient.post<GameRoom>(`${GAMES_ENDPOINTS.ROOM}/${roomId}/join`)
  }

  /**
   * Leave game room
   */
  async leaveRoom(roomId: string): Promise<void> {
    return apiClient.post<void>(`${GAMES_ENDPOINTS.ROOM}/${roomId}/leave`)
  }

  /**
   * Get tournaments
   */
  async getTournaments(): Promise<Tournament[]> {
    return apiClient.get<Tournament[]>(GAMES_ENDPOINTS.TOURNAMENTS)
  }

  /**
   * Get tournament by ID
   */
  async getTournament(id: string): Promise<Tournament> {
    return apiClient.get<Tournament>(GAMES_ENDPOINTS.TOURNAMENT(id))
  }

  /**
   * Join tournament
   */
  async joinTournament(id: string): Promise<Tournament> {
    return apiClient.post<Tournament>(GAMES_ENDPOINTS.JOIN_TOURNAMENT(id))
  }

  /**
   * Leave tournament
   */
  async leaveTournament(id: string): Promise<void> {
    return apiClient.post<void>(GAMES_ENDPOINTS.LEAVE_TOURNAMENT(id))
  }
}

// Singleton instance
export const gamesAPI = new GamesAPI()
export default gamesAPI
