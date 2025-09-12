import { useCallback } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface MemoryCard {
  id: string;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  index: number;
}

/**
 * Хук для логики игры "Мемори"
 * Содержит вспомогательные функции для работы с картами
 */
export const useMemoryGame = (difficulty: Difficulty) => {
  // Генерация пар символов для карт
  const generateCardValues = useCallback((): string[] => {
    const symbols = ['🎉', '🎊', '🎈', '🎁', '🎂', '🍰', '🌟', '⭐', '💎', '💰', '🏆', '🎯', '🎪', '🎭', '🎨', '🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🎤', '🎧', '🎬', '🎮', '🕹️', '🎲', '🃏'];
    
    const pairCount = (() => {
      switch (difficulty) {
        case 'easy': return 6;   // 3x4 = 12 карт
        case 'medium': return 8; // 4x4 = 16 карт  
        case 'hard': return 12;  // 4x6 = 24 карты
        default: return 8;
      }
    })();
    
    // Выбираем случайные символы и дублируем их
    const selectedSymbols = symbols.slice(0, pairCount);
    return [...selectedSymbols, ...selectedSymbols];
  }, [difficulty]);

  // Перемешивание массива (алгоритм Фишера-Йетса)
  const shuffleArray = useCallback(<T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Инициализация карт
  const initializeCards = useCallback((): MemoryCard[] => {
    const values = generateCardValues();
    const shuffledValues = shuffleArray(values);
    
    return shuffledValues.map((value, index) => ({
      id: `card-${index}`,
      value,
      isFlipped: false,
      isMatched: false,
      index
    }));
  }, [generateCardValues, shuffleArray]);

  // Проверка совпадения карт
  const checkMatch = useCallback((card1: MemoryCard, card2: MemoryCard): boolean => {
    return card1.value === card2.value;
  }, []);

  // Проверка завершения игры
  const isGameFinished = useCallback((cards: MemoryCard[]): boolean => {
    return cards.length > 0 && cards.every(card => card.isMatched);
  }, []);

  // Подсчет очков
  const calculateScore = useCallback((moves: number, timeElapsed: number, matches: number): number => {
    const baseScore = matches * 100;
    const timeBonus = Math.max(0, 300 - timeElapsed); // Бонус за быстроту
    const movesPenalty = Math.max(0, moves - matches) * 5; // Штраф за лишние ходы
    const difficultyMultiplier = (() => {
      switch (difficulty) {
        case 'easy': return 1;
        case 'medium': return 1.5;
        case 'hard': return 2;
        default: return 1;
      }
    })();
    
    return Math.round((baseScore + timeBonus - movesPenalty) * difficultyMultiplier);
  }, [difficulty]);

  // Получение размеров сетки для доски
  const getBoardDimensions = useCallback(() => {
    switch (difficulty) {
      case 'easy': return { rows: 3, cols: 4 };
      case 'medium': return { rows: 4, cols: 4 };
      case 'hard': return { rows: 4, cols: 6 };
      default: return { rows: 4, cols: 4 };
    }
  }, [difficulty]);

  return {
    initializeCards,
    checkMatch,
    isGameFinished,
    calculateScore,
    getBoardDimensions
  };
};