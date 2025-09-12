import React from 'react';
import { GameState } from '../../types/gameRoom.types';

interface GameStatusMessageProps {
  gameState: GameState | null;
  user: any;
}

const GameStatusMessage: React.FC<GameStatusMessageProps> = ({ gameState, user }) => {
  if (!gameState || !user) return <span>Подключение к игре...</span>;
  
  if (gameState.status === 'finished') return <span>Игра окончена</span>;
  if (gameState.status !== 'in_progress') return <span></span>;

  switch (gameState.gameType) {
    case 'quiz':
      return <span>Время для квиза!</span>;
      
    case 'chess':
      return (
        <span>
          {gameState.currentPlayerId === user.id ? "Ваш ход" : "Ход соперника"}
        </span>
      );
      
    case 'codenames':
      const userRole = gameState.playerRole;
      const isYourTeam = userRole?.team === gameState.currentTeam;
      
      if (isYourTeam) {
        if (gameState.currentPhase === 'giving_clue') {
          return (
            <span>
              {gameState.currentPlayer === user.id 
                ? "Ваш ход - дайте подсказку команде" 
                : "Ваш капитан дает подсказку"}
            </span>
          );
        } else {
          return (
            <span>
              {gameState.currentPlayer === user.id 
                ? "Ваш ход - выберите карту" 
                : "Ваш игрок выбирает карту"}
            </span>
          );
        }
      } else {
        return <span>Ход команды соперника</span>;
      }
      
    case 'wordle':
    case 'memory':
      return (
        <span>
          {gameState.currentPlayerId === user.id ? "Ваш ход" : "Ход соперника"}
        </span>
      );
      
    default:
      return <span></span>;
  }
};

export default GameStatusMessage;
