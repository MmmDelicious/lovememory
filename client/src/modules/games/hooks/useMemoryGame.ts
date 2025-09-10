import { useState, useEffect, useCallback, useRef } from 'react';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface UseMemoryGameState {
  localFlippedCards: number[];
  isProcessing: boolean;
  lastMoveTime: number;
}

export const useMemoryGame = (gameState: any, user: any, makeMove: Function) => {
  const [state, setState] = useState<UseMemoryGameState>({
    localFlippedCards: [],
    isProcessing: false,
    lastMoveTime: 0
  });

  const cards = gameState?.cards || [];
  const currentPlayerId = gameState?.currentPlayerId;
  const isPlayerTurn = currentPlayerId === user?.id;
  const gameFinished = gameState?.status === 'finished';

  // Синхронизация с сменой хода
  useEffect(() => {
    if (gameState?.currentPlayerId !== currentPlayerId) {
      setState(prev => ({
        ...prev,
        localFlippedCards: [],
        isProcessing: false
      }));
    }
  }, [gameState?.currentPlayerId, currentPlayerId]);

  // Синхронизация с серверным состоянием карточек
  useEffect(() => {
    if (gameState && gameState.cards) {
      const serverFlippedCards = gameState.cards
        .filter((card: Card) => card.isFlipped && !card.isMatched)
        .map((card: Card) => card.id);
      
      if (JSON.stringify(serverFlippedCards.sort()) !== JSON.stringify(state.localFlippedCards.sort())) {
        setState(prev => ({ ...prev, localFlippedCards: serverFlippedCards }));
      }
    }
  }, [gameState?.cards, state.localFlippedCards]);

  const handleCardClick = useCallback((cardId: number) => {
    const now = Date.now();
    if (now - state.lastMoveTime < 500) return;

    if (!isPlayerTurn || state.isProcessing || gameFinished) return;

    const card = cards.find((c: Card) => c.id === cardId);
    if (!card || card.isMatched || card.isFlipped) return;

    // Не больше 2 карт за ход
    if (state.localFlippedCards.length >= 2) return;

    // Проверяем, что карта еще не открыта локально
    if (state.localFlippedCards.includes(cardId)) return;

    setState(prev => ({ 
      ...prev, 
      lastMoveTime: now,
      localFlippedCards: [...prev.localFlippedCards, cardId],
      isProcessing: prev.localFlippedCards.length === 1
    }));

    // Отправляем ход на сервер
    try {
      makeMove({ action: 'flip_card', cardId });
    } catch (error) {
      console.error('Error making move:', error);
    }
  }, [isPlayerTurn, state.isProcessing, gameFinished, cards, state.localFlippedCards, state.lastMoveTime, makeMove]);

  return {
    ...state,
    cards,
    isPlayerTurn,
    gameFinished,
    handleCardClick
  };
};
