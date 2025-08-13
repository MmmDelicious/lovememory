import { FaChess, FaTicketAlt, FaBrain } from 'react-icons/fa';
import { PiCardsFill } from "react-icons/pi";
import type { GameConfig } from '../../types/game.types';

export const GAMES_CONFIG: Record<string, GameConfig> = {
  'tic-tac-toe': {
    id: 'tic-tac-toe',
    name: 'Крестики-нолики',
    category: 'Классика',
    Icon: FaTicketAlt,
  },
  'chess': {
    id: 'chess',
    name: 'Шахматы',
    category: 'Стратегия',
    Icon: FaChess,
  },
  'quiz': {
    id: 'quiz',
    name: 'Квиз',
    category: 'Викторина',
    Icon: FaBrain,
  },
  'poker': {
    id: 'poker',
    name: 'Покер',
    category: 'Карточные',
    Icon: PiCardsFill,
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