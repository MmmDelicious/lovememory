import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

// Resolve socket URL robustly across environments
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_SERVER_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000';

export const useGameSocket = (roomId, token, setCoinsCallback) => {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !roomId) return;

    const socket = io(SOCKET_URL, { 
      auth: { token },
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SOCKET] Connected with id:', socket.id);
      setIsConnected(true);
      socket.emit('join_room', roomId);
    });

    socket.on('disconnect', () => {
      console.log('[SOCKET] Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error("[SOCKET] Connection error:", err.message);
      console.error("[SOCKET] Error details:", err);
      
      if (err.message.includes('Invalid namespace')) {
        console.error("[SOCKET] Invalid namespace error - check server configuration");
      }
      
      // Не показываем alert для каждой ошибки, только логируем
      console.log("Не удалось подключиться к игре. Попробуйте обновить страницу.");
    });

    const handleStateUpdate = (newGameState) => {
      console.log('[CLIENT] Received game state update:', newGameState);
      setGameState(newGameState);
    };

    const handlePlayerListUpdate = (players) => {
      console.log('[CLIENT] Received player list update:', players);
      setGameState(prevState => {
        if (!prevState) {
          return { players, status: 'waiting' };
        }
        return { ...prevState, players };
      });
    };

    socket.on('player_list_update', handlePlayerListUpdate);
    socket.on('game_start', handleStateUpdate);
    socket.on('game_update', handleStateUpdate);
    socket.on('game_end', handleStateUpdate);
    
    if (setCoinsCallback) {
      socket.on('update_coins', setCoinsCallback);
    }
    
    socket.on('error', (errorMessage) => {
      console.error('[SOCKET] Error received:', errorMessage);
      // Показываем ошибку, но не выбрасываем из игры
      alert(`Ошибка: ${errorMessage}`);
      // navigate('/games'); // Убираем автоматический переход
    });

    return () => {
      console.log('[SOCKET] Cleaning up socket connection.');
      socket.off('player_list_update');
      socket.off('game_start');
      socket.off('game_update');
      socket.off('game_end');
      socket.off('update_coins');
      socket.off('error');
      socket.disconnect();
    };
  }, [roomId, token, navigate, setCoinsCallback]);

  const makeMove = (move) => {
    console.log('[CLIENT] makeMove called with:', move);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('make_move', { roomId, move });
      console.log('[CLIENT] make_move event emitted');
    } else {
      console.error('[SOCKET] Cannot make move, socket not connected.');
      throw new Error('Нет подключения к серверу');
    }
  };

  return { gameState, isConnected, makeMove };
};