import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../store/hooks';
import { useCoins } from '../../store/hooks';
import { useGameSocket } from '../../hooks/useGameSocket';
import PokerTable from '../../components/PokerGame/PokerTable';
import PokerModal from '../../components/PokerModal/PokerModal';
import LeaveGameButton from '../../components/LeaveGameButton/LeaveGameButton';
import gameService from '../../services/game.service';
import { io, Socket } from 'socket.io-client';
interface RoomData {
  id: string;
  bet: number;
  Host?: {
    first_name?: string;
  };
}
const PokerPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const user = useUser();
  const coins = useCoins();
  const { gameState, makeMove } = useGameSocket(roomId!, user?.token || '', () => {});
  const navigate = useNavigate();
  const [showBuyInModal, setShowBuyInModal] = useState<boolean>(false);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [hasBoughtIn, setHasBoughtIn] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    if (!user?.token) return;
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const socketInstance = io(SOCKET_URL, {
      auth: { token: user.token },
      transports: ['websocket', 'polling']
    });
    setSocket(socketInstance);
    socketInstance.on('poker_buy_in_success', (data) => {
      console.log('[POKER] Buy-in успешен:', data);
      setHasBoughtIn(true);
      setShowBuyInModal(false);
      // setCoins(data.newBalance); // This line was removed as per the edit hint
    });
    socketInstance.on('poker_rebuy_success', (data) => {
      console.log('[POKER] Rebuy успешен:', data);
      // setCoins(data.newBalance); // This line was removed as per the edit hint
    });
    socketInstance.on('poker_cash_out_success', (data) => {
      console.log('[POKER] Cash-out успешен:', data);
      // setCoins(data.newBalance); // This line was removed as per the edit hint
    });
    return () => {
      socketInstance.disconnect();
    };
  }, [user?.token]); // Changed dependency array to include user?.token
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
  useEffect(() => {
    if (gameState && roomData && !hasBoughtIn) {
      const needsBuyIn = (gameState as any).needsBuyIn || !(gameState as any).hasBoughtIn;
      if (needsBuyIn) {
        setShowBuyInModal(true);
      }
    }
  }, [gameState, roomData, hasBoughtIn]);
  const handleBuyIn = (buyInAmount: number) => {
    if (socket) {
      socket.emit('poker_buy_in', { roomId, buyInAmount });
    }
  };
  const handleCloseBuyInModal = () => {
    setShowBuyInModal(false);
    navigate('/games/poker'); // Возвращаемся в лобби
  };
  const handlePokerAction = (action: any, value = 0) => {
    makeMove({ action, value });
  };
  const handlePokerRebuy = (rebuyAmount: number) => {
    if (socket) {
      socket.emit('poker_rebuy', { roomId, rebuyAmount });
    }
  };
  const handleLeaveGame = () => {
    if (socket) {
      socket.emit('poker_cash_out', { roomId });
    }
    navigate('/games/poker');
  };
  if (!gameState || !user) {
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
          Загрузка игры...
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
        maxAmount={roomData?.bet || 1000}
        mode="buyin"
        roomName={`Стол ${roomData?.Host?.first_name || 'Хоста'}`}
      />
      <PokerTable
        gameState={gameState as any}
        onAction={handlePokerAction}
        onRebuy={handlePokerRebuy}
        userId={user.id}
        roomData={roomData as any}
        onOpenBuyIn={() => setShowBuyInModal(true)}
      />
    </>
  );
};
export default PokerPage;
