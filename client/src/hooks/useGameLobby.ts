import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import gameService from '../services/game.service';
import type { GameRoom, UseGameLobbyReturn } from '../../types/game.types';

// Resolve socket URL robustly across environments
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_SERVER_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000';

export const useGameLobby = (gameType: string): UseGameLobbyReturn => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchRooms = useCallback(async () => {
    if (!gameType) return;
    try {
      setIsLoading(true);
      setError(null);
      const fetchedRooms = await gameService.getRooms(gameType);
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
      console.log('Lobby socket connected successfully.');
    });

    socket.on('connect_error', (err: Error) => {
      console.error('Lobby socket connection error:', err.message);
      console.error('Lobby socket error details:', err);
    });

    socket.on('room_list_updated', () => {
      console.log('Received "room_list_updated" event, refreshing rooms.');
      fetchRooms();
    });

    socket.on('disconnect', () => {
      console.log('Lobby socket disconnected.');
    });

    return () => {
      console.log('Cleaning up lobby socket.');
      socket.off('room_list_updated');
      socket.disconnect();
    };
  }, [token, fetchRooms]);

  const createRoom = async (formData: any): Promise<GameRoom> => {
    const newRoom = await gameService.createRoom(formData);
    fetchRooms();
    return newRoom;
  };
  
  return { rooms, isLoading, error, createRoom, refreshRooms: fetchRooms };
};