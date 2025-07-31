import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const useGameSocket = (roomId, token, setCoinsCallback) => {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !roomId) return;

    const socket = io(API_BASE_URL, { auth: { token } });
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
      alert("Не удалось подключиться к игре. Попробуйте обновить страницу.");
      navigate('/games');
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
      alert(`Ошибка: ${errorMessage}`);
      navigate('/games');
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
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('make_move', { roomId, move });
    } else {
      console.error('[SOCKET] Cannot make move, socket not connected.');
    }
  };

  return { gameState, isConnected, makeMove };
};