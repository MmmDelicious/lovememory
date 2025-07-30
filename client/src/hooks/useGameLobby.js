import { useState, useEffect, useCallback } from 'react';
import { gameService } from '../services';

export const useGameLobby = (gameType) => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRooms = useCallback(async () => {
    if (!gameType) return;
    try {
      setIsLoading(true);
      setError(null);
      const fetchedRooms = await gameService.getRooms(gameType);
      // Сервис должен возвращать массив, убедимся что это так
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

  const createRoom = async (formData) => {
    // Эта функция теперь просто проксирует запрос к сервису
    // и возвращает результат, чтобы компонент мог с ним работать
    return gameService.createRoom(formData);
  };

  return { rooms, isLoading, error, createRoom, refreshRooms: fetchRooms };
};