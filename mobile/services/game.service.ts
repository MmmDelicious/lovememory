import { api } from './api';

export type GameType = 'poker' | 'quiz' | 'chess' | 'tictactoe' | 'wordle';

export type Room = {
  id: string | number;
  gameType: GameType;
  bet: number;
  players: (string | number)[];
  playerCount: number;
  maxPlayers: number;
  status?: 'waiting' | 'in_progress' | 'finished';
  tableType?: 'standard' | 'premium' | 'elite' | null;
  blinds?: string | null;
};

export async function getRooms(params?: { gameType?: GameType }) {
  const res = await api.get<Room[]>('/games', { params });
  return res.data;
}

export async function createRoom(roomData: { gameType: GameType; bet: number; maxPlayers: number; tableType?: 'standard' | 'premium' | 'elite' }) {
  const res = await api.post<Room>('/games/room', roomData);
  return res.data;
}


