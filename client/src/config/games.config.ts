import { ComponentType } from 'react';
import { 
  FaChess, 
  FaCogs, 
  FaQuestionCircle, 
  FaKeyboard,
  FaDice,
  FaEye
} from 'react-icons/fa';
import { GameConfig } from '../../types/game.types';

export const GAMES_CONFIG: Record<string, GameConfig> = {
  poker: {
    id: 'poker',
    name: 'Покер',
    description: 'Классический покер Техас Холдем',
    category: 'Карты',
    icon: FaChess as ComponentType<any>,
    minPlayers: 2,
    maxPlayers: 6,
    difficulty: 'Средняя',
    players: '2-6 игроков',
    minBet: 10,
    maxBet: 1000,
    defaultBet: 50
  },
  quiz: {
    id: 'quiz',
    name: 'Квиз',
    description: 'Викторина на эрудицию',
    category: 'Знания',
    icon: FaQuestionCircle as ComponentType<any>,
    minPlayers: 2,
    maxPlayers: 8,
    difficulty: 'Легкая',
    players: '2-8 игроков',
    minBet: 5,
    maxBet: 500,
    defaultBet: 25
  },
  memory: {
    id: 'memory',
    name: 'Память',
    description: 'Игра на запоминание',
    category: 'Логика',
    icon: FaCogs as ComponentType<any>,
    minPlayers: 2,
    maxPlayers: 4,
    difficulty: 'Легкая',
    players: '2-4 игрока',
    minBet: 5,
    maxBet: 200,
    defaultBet: 20
  },
  wordle: {
    id: 'wordle',
    name: 'Wordle',
    description: 'Угадай слово за минимальное количество попыток',
    category: 'Слова',
    icon: FaKeyboard as ComponentType<any>,
    minPlayers: 2,
    maxPlayers: 2,
    difficulty: 'Средняя',
    players: '2 игрока',
    minBet: 10,
    maxBet: 500,
    defaultBet: 30
  },
  codenames: {
    id: 'codenames',
    name: 'Codenames',
    description: 'Командная игра с ассоциациями и подсказками',
    category: 'Командная',
    icon: FaEye as ComponentType<any>,
    minPlayers: 4,
    maxPlayers: 4,
    difficulty: 'Средняя',
    players: '4 игрока (2v2)',
    minBet: 15,
    maxBet: 750,
    defaultBet: 40
  }
};

export const GAME_EXTRAS: Record<string, any> = {
  poker: {
    emoji: '🃏',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  quiz: {
    emoji: '🧠',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  memory: {
    emoji: '🧩',
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  wordle: {
    emoji: '📝',
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  codenames: {
    emoji: '🕵️',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
};

export function getGameSettings(gameId: string) {
  const config = GAMES_CONFIG[gameId];
  if (!config) return {};

  const baseSettings = {
    language: {
      type: 'select' as const,
      label: 'Язык',
      options: [
        { value: 'russian', label: 'Русский' },
        { value: 'english', label: 'English' }
      ],
      default: 'russian'
    }
  };

  switch (gameId) {
    case 'wordle':
      return {
        ...baseSettings,
        rounds: {
          type: 'select' as const,
          label: 'Раундов',
          options: [
            { value: 1, label: '1 раунд' },
            { value: 3, label: '3 раунда' },
            { value: 5, label: '5 раундов' }
          ],
          default: 3
        }
      };
    case 'quiz':
      return {
        ...baseSettings,
        category: {
          type: 'select' as const,
          label: 'Категория',
          options: [
            { value: 'mixed', label: 'Смешанная' },
            { value: 'history', label: 'История' },
            { value: 'science', label: 'Наука' },
            { value: 'sports', label: 'Спорт' }
          ],
          default: 'mixed'
        }
      };
    case 'codenames':
      return {
        ...baseSettings,
        difficulty: {
          type: 'select' as const,
          label: 'Сложность',
          options: [
            { value: 'easy', label: 'Легкий (больше времени)' },
            { value: 'normal', label: 'Обычный' },
            { value: 'hard', label: 'Сложный (меньше времени)' }
          ],
          default: 'normal'
        },
        teamAssignment: {
          type: 'select' as const,
          label: 'Распределение команд',
          options: [
            { value: 'auto', label: 'Автоматическое' },
            { value: 'manual', label: 'Ручное' }
          ],
          default: 'auto'
        }
      };
    default:
      return {};
  }
}