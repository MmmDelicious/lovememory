import { FaChess, FaTicketAlt, FaBrain, FaCogs } from 'react-icons/fa';
import { PiCardsFill } from "react-icons/pi";
import type { GameConfig } from '../../types/game.types';

export const GAMES_CONFIG: Record<string, GameConfig> = {
  'tic-tac-toe': {
    id: 'tic-tac-toe',
    name: 'Крестики-нолики',
    category: 'Классика',
    Icon: FaTicketAlt,
    description: 'Быстрая игра на логику',
    difficulty: 'easy' as const,
    players: '2 игрока',
    minBet: 10,
    maxBet: 500,
    defaultBet: 25,
  },
  'chess': {
    id: 'chess',
    name: 'Шахматы',
    category: 'Стратегия',
    Icon: FaChess,
    description: 'Стратегическая битва умов',
    difficulty: 'hard' as const,
    players: '2 игрока',
    minBet: 50,
    maxBet: 2000,
    defaultBet: 100,
  },
  'quiz': {
    id: 'quiz',
    name: 'Квиз',
    category: 'Викторина',
    Icon: FaBrain,
    description: 'Проверьте свои знания',
    difficulty: 'medium' as const,
    players: '2 игрока',
    minBet: 15,
    maxBet: 1000,
    defaultBet: 50,
  },
  'poker': {
    id: 'poker',
    name: 'Покер',
    category: 'Карточные',
    Icon: PiCardsFill,
    description: 'Карточная игра на мастерство',
    difficulty: 'hard' as const,
    players: '2-6 игроков',
    minBet: 100,
    maxBet: 5000,
    defaultBet: 200,
  },
  'memory': {
    id: 'memory',
    name: 'Мемори',
    category: 'Память',
    Icon: FaCogs,
    description: 'Тренируйте память',
    difficulty: 'medium' as const,
    players: '2-4 игрока',
    minBet: 15,
    maxBet: 300,
    defaultBet: 30,
  },
  'wordle': {
    id: 'wordle',
    name: 'Wordle',
    category: 'Слова',
    Icon: FaBrain,
    description: 'Угадайте слово за 6 попыток',
    difficulty: 'medium' as const,
    players: '1-2 игрока',
    minBet: 20,
    maxBet: 200,
    defaultBet: 50,
  }
};

export const GAMES_LIST: GameConfig[] = Object.values(GAMES_CONFIG);

// Экономические настройки
export const ECONOMIC_CONFIG = {
  winnerBonusPercent: 10,
  minimumBet: 10,
  maximumBet: 1000,
  defaultCoins: 1000,
  
  // Настройки покера
  poker: {
    tableTypes: {
      standard: { minBet: 10, maxBet: 100, blinds: '5/10' },
      premium: { minBet: 50, maxBet: 500, blinds: '25/50' },
      elite: { minBet: 200, maxBet: 2000, blinds: '100/200' }
    },
    turnTimeLimit: 30, // секунд
    rebuyMultiplier: 1.0 // коэффициент для докупки
  },
  
  // Настройки шахмат
  chess: {
    timeControl: 300, // 5 минут
    increment: 2 // 2 секунды за ход
  },
  
  // Настройки квиза
  quiz: {
    questionTimeLimit: 15, // секунд
    totalQuestions: 10,
    pointsPerCorrectAnswer: 1
  }
};