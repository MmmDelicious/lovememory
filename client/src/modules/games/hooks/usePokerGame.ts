import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@app';
import { io, Socket } from 'socket.io-client';
import type { PokerGameState } from '../../../types/game.types';
import gameService from '../services/game.service';

interface RoomData {
  id: string;
  bet: number;
  name: string;
  gameType: string;
  maxPlayers: number;
  currentPlayers: number;
  status: string;
  host: {
    id: string;
    first_name?: string;
    name?: string;
  };
  Host?: {
    first_name?: string;
  };
}

interface UsePokerGameState {
  roomData: RoomData | null;
  gameState: PokerGameState | null;
  showBuyInModal: boolean;
  isConnecting: boolean;
}

export const usePokerGame = (roomId: string | undefined) => {
  const user = useUser();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef<boolean>(true);
  
  const [state, setState] = useState<UsePokerGameState>({
    roomData: null,
    gameState: null,
    showBuyInModal: false,
    isConnecting: true
  });

  // Game actions
  const makeMove = useCallback((move: { action: string; value?: number }) => {
    console.log(`🚀 [usePokerGame] makeMove called`, {
      timestamp: new Date().toISOString(),
      roomId,
      move,
      socketConnected: socketRef.current?.connected,
      userId: user?.id
    });

    if (socketRef.current?.connected) {
      socketRef.current.emit('make_move', { 
        roomId, 
        action: move.action, 
        value: move.value 
      });
    } else {
      console.warn(`❌ [usePokerGame] Cannot make move: socket not connected`);
    }
  }, [roomId, user?.id]);

  const handleBuyIn = useCallback((buyInAmount: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('poker_buy_in', { roomId, buyInAmount });
    } else {
      console.warn('[usePokerGame] Cannot buy-in: socket not connected');
    }
  }, [roomId]);

  const handleRebuy = useCallback((rebuyAmount: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('poker_rebuy', { roomId, rebuyAmount });
    } else {
      console.warn('[usePokerGame] Cannot rebuy: socket not connected');
    }
  }, [roomId]);

  const handleLeaveGame = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('poker_cash_out', { roomId });
    }
    navigate('/games/poker');
  }, [roomId, navigate]);

  const handlePokerAction = useCallback((action: string, value = 0) => {
    console.log(`🎰 [usePokerGame] handlePokerAction triggered`, {
      timestamp: new Date().toISOString(),
      action,
      value,
      roomId,
      userId: user?.id,
      gameStage: state.gameState?.stage,
      currentPlayerId: state.gameState?.currentPlayerId
    });
    
    makeMove({ action, value });
  }, [makeMove, roomId, user?.id, state.gameState?.stage, state.gameState?.currentPlayerId]);

  const closeBuyInModal = useCallback(() => {
    setState(prev => ({ ...prev, showBuyInModal: false }));
  }, []);

  const openBuyInModal = useCallback(() => {
    setState(prev => ({ ...prev, showBuyInModal: true }));
  }, []);

  // Socket connection
  useEffect(() => {
    if (!user?.token || !roomId) return;
    
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    // Закрываем предыдущий сокет если есть
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    const socketInstance = io(SOCKET_URL, {
      auth: { token: user.token },
      transports: ['websocket', 'polling'],
      forceNew: true
    });
    
    socketRef.current = socketInstance;
    
    // Connection handlers
    socketInstance.on('connect', () => {
      if (!mountedRef.current) return;
      setState(prev => ({ ...prev, isConnecting: false }));
      socketInstance.emit('join_room', roomId);
    });
    
    socketInstance.on('disconnect', () => {
      if (!mountedRef.current) return;
      setState(prev => ({ ...prev, isConnecting: true }));
    });
    
    socketInstance.on('connect_error', (error) => {
      if (!mountedRef.current) return;
      console.error('[usePokerGame] Socket connection error:', error);
      setState(prev => ({ ...prev, isConnecting: true }));
    });
    
    socketInstance.on('error', (error) => {
      if (!mountedRef.current) return;
      console.error('❌ [usePokerGame] Socket error received:', error);
    });

    socketInstance.on('move_error', (error) => {
      if (!mountedRef.current) return;
      console.error('❌ [usePokerGame] Move error received from server:', {
        timestamp: new Date().toISOString(),
        error,
        roomId
      });
    });
    
    socketInstance.on('reconnect', () => {
      if (!mountedRef.current) return;
      setState(prev => ({ ...prev, isConnecting: false }));
    });
    
    socketInstance.on('reconnect_error', (error) => {
      if (!mountedRef.current) return;
      console.error('[usePokerGame] Socket reconnect error:', error);
    });
    
    // Game event handlers
    const handleGameUpdate = (newGameState: PokerGameState) => {
      if (!mountedRef.current) return;

      console.log(`📥 [usePokerGame] Received game_update from server`, {
        timestamp: new Date().toISOString(),
        stage: newGameState?.stage,
        status: newGameState?.status,
        currentPlayerId: newGameState?.currentPlayerId,
        validActions: newGameState?.validActions,
        showdownPhase: newGameState?.showdownPhase,
        playersCount: newGameState?.players?.length,
        needsBuyIn: newGameState?.needsBuyIn,
        hasBoughtIn: newGameState?.hasBoughtIn,
        pot: newGameState?.pot,
        callAmount: newGameState?.callAmount,
        minRaiseAmount: newGameState?.minRaiseAmount,
        maxRaiseAmount: newGameState?.maxRaiseAmount
      });

      setState(prev => ({ ...prev, gameState: newGameState }));
    };
    
    const handleRoomInfo = (roomInfo: any) => {
      if (!mountedRef.current) return;
      // Преобразуем в формат PokerGameState если необходимо
      if (roomInfo.gameType === 'poker' || roomInfo.players) {
        setState(prev => ({ ...prev, gameState: roomInfo }));
      }
    };
    
    const handleBuyInSuccess = (data: { buyInAmount: number; stack: number }) => {
      if (!mountedRef.current) return;
      console.log('[usePokerGame] Buy-in successful:', data);
    };
    
    const handleRebuySuccess = (data: { rebuyAmount: number; oldStack: number; newStack: number }) => {
      if (!mountedRef.current) return;
      console.log('[usePokerGame] Rebuy successful:', data);
    };
    
    const handleCashOutSuccess = (data: { cashOutAmount: number }) => {
      if (!mountedRef.current) return;
      console.log('[usePokerGame] Cash out successful:', data);
    };
    
    // Subscribe to events
    socketInstance.on('game_update', handleGameUpdate);
    socketInstance.on('room_info', handleRoomInfo);
    socketInstance.on('poker_buy_in_success', handleBuyInSuccess);
    socketInstance.on('poker_rebuy_success', handleRebuySuccess);
    socketInstance.on('poker_cash_out_success', handleCashOutSuccess);
    
    return () => {
      mountedRef.current = false;
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [user?.token, roomId]);

  // Fetch room data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const rooms = await gameService.getRooms('poker');
        const room = rooms.find((r: any) => r.id === roomId);
        if (room) {
          setState(prev => ({ ...prev, roomData: room }));
        } else {
          console.error('Комната не найдена');
          navigate('/games/poker');
        }
      } catch (error) {
        console.error('Ошибка загрузки данных комнаты:', error);
        navigate('/games/poker');
      }
    };

    if (roomId && !state.roomData) {
      fetchRoomData();
    }
  }, [roomId, state.roomData, navigate]);

  // Buy-in modal logic
  useEffect(() => {
    if (!state.gameState || !mountedRef.current) return;
    
    const needsBuyIn = Boolean(state.gameState.needsBuyIn);
    const hasBoughtInFromServer = Boolean(state.gameState.hasBoughtIn);

    // Показываем модалку только если нужен buy-in и игрок не сделал его
    if (needsBuyIn && !hasBoughtInFromServer) {
      if (!state.showBuyInModal) {
        setState(prev => ({ ...prev, showBuyInModal: true }));
      }
    } 
    // Скрываем модалку если buy-in уже сделан
    else if (hasBoughtInFromServer) {
      if (state.showBuyInModal) {
        setState(prev => ({ ...prev, showBuyInModal: false }));
      }
    }
  }, [state.gameState?.needsBuyIn, state.gameState?.hasBoughtIn, state.gameState?.status, state.showBuyInModal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    makeMove,
    handleBuyIn,
    handleRebuy,
    handleLeaveGame,
    handlePokerAction,
    closeBuyInModal,
    openBuyInModal
  };
};
