import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { gameService } from '../services';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const useGameLobby = (gameType) => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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

    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Lobby socket connected successfully.');
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

  const createRoom = async (formData) => {
    const newRoom = await gameService.createRoom(formData);
    fetchRooms();
    return newRoom;
  };
  
  return { rooms, isLoading, error, createRoom, refreshRooms: fetchRooms };
};