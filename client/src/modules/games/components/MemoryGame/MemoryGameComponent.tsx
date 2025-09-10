import React from 'react';
import MemoryGame from './MemoryGame';

interface MemoryGameComponentProps {
  gameState: any;
  user: { id: string; email: string };
  makeMove: (cardId: number) => void;
  handleReturnToLobby: () => void;
}

const MemoryGameComponent: React.FC<MemoryGameComponentProps> = (props) => {
  return <MemoryGame {...props} />;
};

export default MemoryGameComponent;
