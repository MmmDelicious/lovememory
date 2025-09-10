import React from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '@app';
import { usePokerGame } from '../../hooks/usePokerGame';
import PokerTable from '../../components/PokerGame/PokerTable';
import PokerModal from '../../components/PokerModal/PokerModal';
import LeaveGameButton from '@shared';

/**
 * PokerPage - Простая композиция компонентов для покера
 * Вся бизнес-логика вынесена в usePokerGame хук
 */
const PokerPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const user = useUser();
  
  // Вся логика в хуке
  const poker = usePokerGame(roomId);

  // Loading state
  if (!poker.gameState || !user || poker.isConnecting) {
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
          {poker.isConnecting ? 'Подключение к игре...' : 'Загрузка игры...'}
          {poker.isConnecting && (
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
  
  // Main game UI - простая композиция компонентов
  return (
    <>
      <LeaveGameButton gameType="poker" />
      
      <PokerModal
        isOpen={poker.showBuyInModal}
        onClose={poker.closeBuyInModal}
        onConfirm={poker.handleBuyIn}
        maxAmount={poker.roomData?.bet ?? 1000}
        mode="buyin"
        roomName={`Стол ${poker.roomData?.Host?.first_name || 'Хоста'}`}
      />
      
      <PokerTable
        gameState={poker.gameState}
        onAction={poker.handlePokerAction}
        onRebuy={poker.handleRebuy}
        userId={user.id}
        roomData={poker.roomData}
        onOpenBuyIn={poker.openBuyInModal}
      />
    </>
  );
};
export default PokerPage;
