import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '../../../store/hooks';
import { gamesAPI } from '@api/games';
import type { GameRoom, UseGameLobbyReturn } from '../../../types/game.types';
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_SERVER_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000';
export const useGameLobby = (gameType: string): UseGameLobbyReturn => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const user = useUser();
  const token = user?.token;
  const fetchRooms = useCallback(async () => {
    if (!gameType) return;
    try {
      setIsLoading(true);
      setError(null);
      const fetchedRooms = await gamesAPI.getRooms(gameType);
      setRooms(Array.isArray(fetchedRooms) ? fetchedRooms : []);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      setError("Не удалось загрузить список комнат.");
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, [gameType]);
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);
  useEffect(() => {
    if (!token) return;
    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    socket.on('connect', () => {
      });
    socket.on('connect_error', (err: Error) => {
      console.error('Lobby socket connection error:', err.message);
      console.error('Lobby socket error details:', err);
    });
    socket.on('room_list_updated', () => {
      fetchRooms();
    });
    socket.on('disconnect', () => {
      });
    return () => {
      socket.off('room_list_updated');
      socket.disconnect();
    };
  }, [token, fetchRooms]);
  const createRoom = async (formData: any): Promise<GameRoom> => {
    const newRoom = await gamesAPI.createRoom(formData);
    fetchRooms();
    return newRoom;
  };
  return { rooms, isLoading, error, createRoom, refreshRooms: fetchRooms };
};
