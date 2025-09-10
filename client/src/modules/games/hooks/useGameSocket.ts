import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import type { GameState, GameMove, UseGameSocketReturn } from '../../types/game.types';
import { toast } from '../../../context/ToastContext';
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
  const [gameState, setGameState] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  useEffect(() => {
    if (!token || !roomId) return;
    const socket = io(SOCKET_URL, { 
      auth: { token },
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', roomId);
    });
    socket.on('disconnect', () => {
      setIsConnected(false);
    });
    socket.on('connect_error', (err: Error) => {
      console.error("[SOCKET] Connection error:", err.message);
      console.error("[SOCKET] Error details:", err);
      if (err.message.includes('Invalid namespace')) {
        console.error("[SOCKET] Invalid namespace error - check server configuration");
      }
      });
    const handleStateUpdate = (newGameState: any) => {
      setGameState(newGameState);
    };
    const handleRoomInfo = (roomInfo: any) => {
      setGameState((prevState: any) => ({
        ...prevState,
        gameType: roomInfo.gameType,
        status: roomInfo.status || prevState?.status || 'waiting',
        players: prevState?.players || [],
        currentPlayerId: prevState?.currentPlayerId || null,
        winner: prevState?.winner || null,
        isDraw: prevState?.isDraw || false
      }));
    };
    const handlePlayerListUpdate = (players: any[]) => {
      setGameState((prevState: any) => {
        if (!prevState) {
          return { 
            players: players.map(p => p.id), 
            status: 'waiting',
            gameType: 'unknown',
            currentPlayerId: null,
            winner: null,
            isDraw: false
          } as any;
        }
        return { 
          ...prevState, 
          players: players.map(p => p.id),
          gameType: prevState.gameType !== 'unknown' ? prevState.gameType : 'unknown'
        } as any;
      });
    };
    socket.on('room_info', handleRoomInfo);
    socket.on('player_list_update', handlePlayerListUpdate);
    socket.on('game_start', handleStateUpdate);
    socket.on('game_update', handleStateUpdate);
    socket.on('game_end', handleStateUpdate);
    socket.on('new_hand_started', handleStateUpdate);
    socket.on('rebuy_opportunity', (data: { message: string }) => {
      });
    if (setCoinsCallback) {
      socket.on('update_coins', setCoinsCallback);
    }
    socket.on('error', (errorMessage: string) => {
      console.error('[SOCKET] Error received:', errorMessage);
      toast.error(errorMessage, 'Ошибка игры');
    });

    socket.on('move_error', (data: { error: string }) => {
      console.error('[SOCKET] Move error received:', data.error);
      toast.error(data.error, 'Ошибка хода');
    });

    return () => {
      socket.off('player_list_update');
      socket.off('game_start');
      socket.off('game_update');
      socket.off('game_end');
      socket.off('new_hand_started');
      socket.off('rebuy_opportunity');
      socket.off('update_coins');
      socket.off('error');
      socket.off('move_error');
      socket.disconnect();
    };
  }, [roomId, token, navigate, setCoinsCallback]);
  const makeMove = useCallback((move: GameMove) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('make_move', { roomId, move });
      } else {
      console.error('[SOCKET] Cannot make move, socket not connected.');
      throw new Error('Нет подключения к серверу');
    }
  }, [roomId]);
  return { gameState, isConnected, makeMove };
};
