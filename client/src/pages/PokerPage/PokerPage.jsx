import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useGameSocket } from '../../hooks/useGameSocket';
import PokerTable from '../../components/PokerGame/PokerTable';
import LeaveGameButton from '../../components/LeaveGameButton/LeaveGameButton';

const PokerPage = () => {
  const { roomId } = useParams();
  const { token, user } = useAuth();
  const { setCoins } = useCurrency();
  const { gameState, makeMove } = useGameSocket(roomId, token, setCoins);

  const handlePokerAction = (action, value = 0) => {
    makeMove({ action, value });
  };

  const handlePokerRebuy = () => {
    makeMove({ action: 'rebuy' });
  };

  if (!gameState || !user) {
    return (
      <>
        <LeaveGameButton gameType="poker" />
        <div>Загрузка...</div>
      </>
    );
  }

  return (
    <>
      <LeaveGameButton gameType="poker" />
      <PokerTable
        gameState={gameState}
        onAction={handlePokerAction}
        onRebuy={handlePokerRebuy}
        userId={user.id}
      />
    </>
  );
};

export default PokerPage;