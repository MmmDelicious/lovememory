import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import type { GameState, GameMove, UseGameSocketReturn } from '../../types/game.types';

// Resolve socket URL robustly across environments
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_SERVER_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000';

export const useGameSocket = (
  roomId: string, 
  token: string, 
  setCoinsCallback?: (coins: number) => void
): UseGameSocketReturn => {
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

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

    socket.on('connect_error', (err: Error) => {
      console.error("[SOCKET] Connection error:", err.message);
      console.error("[SOCKET] Error details:", err);
      
      if (err.message.includes('Invalid namespace')) {
        console.error("[SOCKET] Invalid namespace error - check server configuration");
      }
      
      // Не показываем alert для каждой ошибки, только логируем
      console.log("Не удалось подключиться к игре. Попробуйте обновить страницу.");
    });

    const handleStateUpdate = (newGameState: GameState) => {
      console.log('[CLIENT] Received game state update:', newGameState);
      setGameState(newGameState);
    };

    const handlePlayerListUpdate = (players: any[]) => {
      console.log('[CLIENT] Received player list update:', players);
      setGameState(prevState => {
        if (!prevState) {
          return { 
            players: players.map(p => p.id), 
            status: 'waiting',
            gameType: 'unknown',
            currentPlayerId: null,
            winner: null,
            isDraw: false
          } as GameState;
        }
        return { ...prevState, players: players.map(p => p.id) };
      });
    };

    socket.on('player_list_update', handlePlayerListUpdate);
    socket.on('game_start', handleStateUpdate);
    socket.on('game_update', handleStateUpdate);
    socket.on('game_end', handleStateUpdate);
    socket.on('new_hand_started', handleStateUpdate);
    
    // Обработчик уведомления о возможности rebuy
    socket.on('rebuy_opportunity', (data: { message: string }) => {
      console.log('[CLIENT] Rebuy opportunity:', data.message);
      // Можно показать уведомление пользователю
    });
    
    if (setCoinsCallback) {
      socket.on('update_coins', setCoinsCallback);
    }
    
    socket.on('error', (errorMessage: string) => {
      console.error('[SOCKET] Error received:', errorMessage);
      // Показываем ошибку, но не выбрасываем из игры
      alert(`Ошибка: ${errorMessage}`);
    });

    return () => {
      console.log('[SOCKET] Cleaning up socket connection.');
      socket.off('player_list_update');
      socket.off('game_start');
      socket.off('game_update');
      socket.off('game_end');
      socket.off('new_hand_started');
      socket.off('rebuy_opportunity');
      socket.off('update_coins');
      socket.off('error');
      socket.disconnect();
    };
  }, [roomId, token, navigate, setCoinsCallback]);

  const makeMove = useCallback((move: GameMove) => {
    console.log('[CLIENT] makeMove called with:', move);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('make_move', { roomId, move });
      console.log('[CLIENT] make_move event emitted');
    } else {
      console.error('[SOCKET] Cannot make move, socket not connected.');
      throw new Error('Нет подключения к серверу');
    }
  }, [roomId]);

  return { gameState, isConnected, makeMove };
};