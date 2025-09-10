import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../store/hooks';
import PokerTable from '../../components/PokerGame/PokerTable';
import PokerModal from '../../components/PokerModal/PokerModal';
import LeaveGameButton from '../../components/LeaveGameButton/LeaveGameButton';
import gameService from '../../services/game.service';
import { io, Socket } from 'socket.io-client';
import type { PokerGameState, GameRoom } from '../../../types/game.types';
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
const PokerPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const user = useUser();
  const navigate = useNavigate();
  
  // Состояния
  const [showBuyInModal, setShowBuyInModal] = useState<boolean>(false);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [gameState, setGameState] = useState<PokerGameState | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  
  // Refs для стабильности
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef<boolean>(true);
  
  // Функция для отправки ходов
  const makeMove = useCallback((move: any) => {
    console.log(`🚀 [POKER PAGE] makeMove called`, {
      timestamp: new Date().toISOString(),
      roomId,
      move,
      socketConnected: socketRef.current?.connected,
      userId: user?.id
    });

    if (socketRef.current?.connected) {
      console.log(`📡 [POKER PAGE] Emitting make_move to socket`, {
        roomId,
        move,
        action: move.action,
        value: move.value
      });
      socketRef.current.emit('make_move', { roomId, action: move.action, value: move.value });
    } else {
      console.warn(`❌ [POKER PAGE] Cannot make move: socket not connected`);
    }
  }, [roomId, user?.id]);
  // Инициализация сокета
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
    
    // Обработчики подключения
    socketInstance.on('connect', () => {
      if (!mountedRef.current) return;

      setIsConnecting(false);
      socketInstance.emit('join_room', roomId);
    });
    
    socketInstance.on('disconnect', () => {
      if (!mountedRef.current) return;

      setIsConnecting(true);
    });
    
    // КРИТИЧНО: Обработка ошибок сокета
    socketInstance.on('connect_error', (error) => {
      if (!mountedRef.current) return;
      console.error('[POKER] Socket connection error:', error);
      setIsConnecting(true);
    });
    
    socketInstance.on('error', (error) => {
      if (!mountedRef.current) return;
      console.error('❌ [POKER PAGE] Socket error received:', error);
    });

    // Добавляем обработчик ошибок ходов
    socketInstance.on('move_error', (error) => {
      if (!mountedRef.current) return;
      console.error('❌ [POKER PAGE] Move error received from server:', {
        timestamp: new Date().toISOString(),
        error,
        roomId
      });
    });
    
    socketInstance.on('reconnect', (attemptNumber) => {
      if (!mountedRef.current) return;

      setIsConnecting(false);
    });
    
    socketInstance.on('reconnect_error', (error) => {
      if (!mountedRef.current) return;
      console.error('[POKER] Socket reconnect error:', error);
    });
    
    // Обработчики игровых событий
    const handleGameUpdate = (newGameState: PokerGameState) => {
      if (!mountedRef.current) return;

      console.log(`📥 [POKER PAGE] Received game_update from server`, {
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

      setGameState(newGameState);
    };
    
    // КРИТИЧНО: Правильные типы для room_info
    const handleRoomInfo = (roomInfo: any) => {
      if (!mountedRef.current) return;

      // Преобразуем в формат PokerGameState если необходимо
      if (roomInfo.gameType === 'poker' || roomInfo.players) {
        setGameState(roomInfo);
      }
    };
    
    const handleBuyInSuccess = (data: { buyInAmount: number; stack: number }) => {
      if (!mountedRef.current) return;

    };
    
    const handleRebuySuccess = (data: { rebuyAmount: number; oldStack: number; newStack: number }) => {
      if (!mountedRef.current) return;

    };
    
    const handleCashOutSuccess = (data: { cashOutAmount: number }) => {
      if (!mountedRef.current) return;

    };
    
    // КРИТИЧНО: Для покера используем game_update (персонализированное состояние)
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
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const rooms = await gameService.getRooms('poker');
        const room = rooms.find((r: any) => r.id === roomId);
        if (room) {
          setRoomData(room);
        } else {
          console.error('Комната не найдена');
          navigate('/games/poker');
        }
      } catch (error) {
        console.error('Ошибка загрузки данных комнаты:', error);
        navigate('/games/poker');
      }
    };
    if (roomId && !roomData) {
      fetchRoomData();
    }
  }, [roomId, roomData, navigate]);
  // КРИТИЧНО: Удаляем дублирование cleanup (UZЕ есть в socket effect)
  // useEffect(() => {
  //   return () => {
  //     mountedRef.current = false;
  //   };
  // }, []);
  
  // КРИТИЧНО: Логика показа модалки buy-in (исправлено dependencies)
  useEffect(() => {
    if (!gameState || !mountedRef.current) return;
    
    const needsBuyIn = Boolean(gameState.needsBuyIn);
    const hasBoughtInFromServer = Boolean(gameState.hasBoughtIn);
    const gameStatus = gameState.status;

    // Показываем модалку только если нужен buy-in и игрок не сделал его
    if (needsBuyIn && !hasBoughtInFromServer) {
      if (!showBuyInModal) {
  
        setShowBuyInModal(true);
      }
    } 
    // Скрываем модалку если buy-in уже сделан
    else if (hasBoughtInFromServer) {
      if (showBuyInModal) {

        setShowBuyInModal(false);
      }
    }
  }, [gameState?.needsBuyIn, gameState?.hasBoughtIn, gameState?.status]); // УБРАЛИ showBuyInModal из зависимостей
  // Обработчики действий
  const handleBuyIn = useCallback((buyInAmount: number) => {
    if (socketRef.current?.connected) {

      socketRef.current.emit('poker_buy_in', { roomId, buyInAmount });
    } else {
      console.warn('[POKER] Cannot buy-in: socket not connected');
    }
  }, [roomId]);
  
  const handleCloseBuyInModal = useCallback(() => {
    setShowBuyInModal(false);
    // НЕ переходим на другую страницу - остаемся в текущей игре!
    // navigate('/games/poker'); // УБРАНО: Вызывало отключение socket
  }, []);
  
  const handlePokerAction = useCallback((action: string, value = 0) => {
    console.log(`🎰 [POKER PAGE] handlePokerAction triggered`, {
      timestamp: new Date().toISOString(),
      action,
      value,
      roomId,
      userId: user?.id,
      gameStage: gameState?.stage,
      currentPlayerId: gameState?.currentPlayerId
    });
    
    makeMove({ action, value });
  }, [makeMove, roomId, user?.id, gameState?.stage, gameState?.currentPlayerId]);
  
  const handlePokerRebuy = useCallback((rebuyAmount: number) => {
    if (socketRef.current?.connected) {

      socketRef.current.emit('poker_rebuy', { roomId, rebuyAmount });
    } else {
      console.warn('[POKER] Cannot rebuy: socket not connected');
    }
  }, [roomId]);
  
  const handleLeaveGame = useCallback(() => {
    if (socketRef.current?.connected) {

      socketRef.current.emit('poker_cash_out', { roomId });
    }
    navigate('/games/poker');
  }, [roomId, navigate]);
  // Обработчик открытия модалки buy-in (ДОЛЖЕН быть ДО условного рендера!)
  const handleOpenBuyIn = useCallback(() => {
    setShowBuyInModal(true);
  }, []);

  // Показываем загрузку если нет состояния игры или пользователя
  if (!gameState || !user || isConnecting) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        background: '#fdedde', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        position: 'relative'
      }}>
        <LeaveGameButton gameType="poker" />
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(26, 37, 47, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          padding: '30px 40px',
          borderRadius: '16px',
          border: '2px solid rgba(255, 215, 0, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          textAlign: 'center',
          color: '#FFD700',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎰</div>
          {isConnecting ? 'Подключение к игре...' : 'Загрузка игры...'}
          {isConnecting && (
            <div style={{ 
              fontSize: '12px', 
              marginTop: '10px', 
              opacity: 0.7,
              animation: 'pulse 1.5s infinite'
            }}>
              Соединение с сервером
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <>
      <LeaveGameButton gameType="poker" />
      <PokerModal
        isOpen={showBuyInModal}
        onClose={handleCloseBuyInModal}
        onConfirm={handleBuyIn}
        maxAmount={roomData?.bet ?? 1000} // КРИТИЧНО: Проверка undefined bet
        mode="buyin"
        roomName={`Стол ${roomData?.Host?.first_name || 'Хоста'}`}
      />
      <PokerTable
        gameState={gameState}
        onAction={handlePokerAction}
        onRebuy={handlePokerRebuy}
        userId={user.id}
        roomData={roomData as any}
        onOpenBuyIn={handleOpenBuyIn}
      />
    </>
  );
};
export default PokerPage;
