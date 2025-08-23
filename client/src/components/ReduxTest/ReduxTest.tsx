import React from 'react';
import { useGameState, useMascotState, useGameActions, useMascotActions } from '../../store/hooks';

const ReduxTest: React.FC = () => {
  // Получаем состояние из Redux
  const gameState = useGameState();
  const mascotState = useMascotState();
  
  // Получаем действия
  const gameActions = useGameActions();
  const mascotActions = useMascotActions();

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Redux Store Test</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Game State:</h4>
        <pre>{JSON.stringify(gameState, null, 2)}</pre>
        
        <button onClick={() => gameActions.setGameType('chess')}>
          Set Game Type: Chess
        </button>
        <button onClick={() => gameActions.setGameType('poker')}>
          Set Game Type: Poker
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Mascot State:</h4>
        <pre>{JSON.stringify(mascotState, null, 2)}</pre>
        
        <button onClick={() => mascotActions.toggleAI()}>
          Toggle AI Mascot
        </button>
        <button onClick={() => mascotActions.setPosition({ x: 50, y: 50 })}>
          Move Mascot to Center
        </button>
      </div>
      
      <div>
        <h4>Actions Test:</h4>
        <button onClick={() => gameActions.fetchRooms('poker')}>
          Fetch Poker Rooms
        </button>
        <button onClick={() => mascotActions.setMessage('Hello from Redux!')}>
          Set Mascot Message
        </button>
      </div>
    </div>
  );
};

export default ReduxTest;
