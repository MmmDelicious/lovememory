import React from 'react';
import {
  Target,
  Brain,
  Crown,
  Sparkles,
  Zap,
  Trophy
} from 'lucide-react';
import type { GameConfig } from '../../types/game.types';

export const GAMES_LIST: GameConfig[] = [
  {
    id: 'tic-tac-toe',
    name: 'Крестики-нолики',
    category: 'Классика',
    description: 'Классическая игра для двоих',
    longDescription: 'Простая и увлекательная игра, которая никогда не выходит из моды. Проверьте свою стратегию!',
    icon: <Target size={24} />,
    path: '/games/tic-tac-toe',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    image: 'https://images.pexels.com/photos/278918/pexels-photo-278918.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'easy',
    players: '2',
    duration: '5 мин',
    featured: true
  },
  {
    id: 'wordle',
    name: 'Wordle',
    category: 'Память',
    description: 'Соревнование в угадывании слов',
    longDescription: 'Отгадывайте 5-буквенные слова и соревнуйтесь на время с соперником.',
    icon: <Brain size={24} />,
    path: '/games/wordle',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    image: 'https://images.pexels.com/photos/46274/pexels-photo-46274.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'medium',
    players: '2',
    duration: '3–10 мин',
    featured: true
  },
  {
    id: 'chess',
    name: 'Шахматы',
    category: 'Стратегия',
    description: 'Стратегическая битва умов',
    longDescription: 'Королевская игра, которая развивает логическое мышление и стратегические навыки.',
    icon: <Crown size={24} />,
    path: '/games/chess',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    image: 'https://images.pexels.com/photos/260024/pexels-photo-260024.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'hard',
    players: '2',
    duration: '30 мин'
  },
  {
    id: 'quiz',
    name: 'Квиз',
    category: 'Викторина',
    description: 'Проверьте свои знания вместе',
    longDescription: 'Увлекательные вопросы на разные темы. Узнайте, кто из вас эрудит!',
    icon: <Brain size={24} />,
    path: '/games/quiz',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    image: 'https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'medium',
    players: '2-4',
    duration: '15 мин',
    featured: true
  },
  {
    id: 'poker',
    name: 'Покер',
    category: 'Карточные',
    description: 'Карточная игра на удачу и мастерство',
    longDescription: 'Классический покер с элементами блефа и стратегии. Почувствуйте себя в казино!',
    icon: <Sparkles size={24} />,
    path: '/games/poker',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    image: 'https://images.pexels.com/photos/1871508/pexels-photo-1871508.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'hard',
    players: '2-6',
    duration: '45 мин'
  },
  {
    id: 'memory',
    name: 'Мемори',
    category: 'Память',
    description: 'Тренируйте память вместе',
    longDescription: 'Найдите все пары карточек и покажите свою феноменальную память!',
    icon: <Zap size={24} />,
    path: '/games/memory',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    image: 'https://images.pexels.com/photos/1040157/pexels-photo-1040157.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'easy',
    players: '2',
    duration: '10 мин'
  },
  {
    id: 'trivia',
    name: 'Тривия',
    category: 'Знания',
    description: 'Интеллектуальная битва',
    longDescription: 'Сложные вопросы для настоящих знатоков. Проверьте свою эрудицию!',
    icon: <Trophy size={24} />,
    path: '/games/trivia',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    image: 'https://images.pexels.com/photos/207662/pexels-photo-207662.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'medium',
    players: '2-4',
    duration: '20 мин'
  }
];

export const GAMES_CONFIG: Record<string, GameConfig> = GAMES_LIST.reduce((acc, game) => {
    acc[game.id] = game;
    return acc;
}, {} as Record<string, GameConfig>);

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