import { LucideIcon } from 'lucide-react';
import { 
  Target,
  Crown,
  Brain,
  Sparkles,
  Zap,
  Trophy,
  Eye
} from 'lucide-react';

export interface Game {
  id: string;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  shortReason?: string;
  iconName: string; // Изменили с React.ReactNode на string
  path: string;
  gradient: string;
  image: string;
  difficulty: 'easy' | 'medium' | 'hard';
  players: string;
  playersText: string;
  duration: string;
  featured?: boolean;
}

// Маппинг иконок
export const GAME_ICONS: Record<string, LucideIcon> = {
  target: Target,
  crown: Crown,
  brain: Brain,
  sparkles: Sparkles,
  zap: Zap,
  trophy: Trophy,
  eye: Eye
};

export const GAMES: Game[] = [
  {
    id: 'tic-tac-toe',
    name: 'Крестики-нолики',
    category: 'Классика',
    description: 'Классическая игра для двоих',
    longDescription: 'Простая и увлекательная игра, которая никогда не выходит из моды.',
    shortReason: 'Быстрая партия • Идеально для двоих',
    iconName: 'target',
    path: '/games/tic-tac-toe',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    image: 'https://images.pexels.com/photos/278918/pexels-photo-278918.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'easy',
    players: '2',
    playersText: '2 игрока',
    duration: '5 мин',
    featured: true
  },
  {
    id: 'chess',
    name: 'Шахматы',
    category: 'Стратегия',
    description: 'Стратегическая битва умов',
    longDescription: 'Королевская игра, которая развивает логическое мышление и стратегические навыки.',
    shortReason: 'Развивает мышление • Классика',
    iconName: 'crown',
    path: '/games/chess',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    image: 'https://images.pexels.com/photos/260024/pexels-photo-260024.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'hard',
    players: '2',
    playersText: '2 игрока',
    duration: '30 мин'
  },
  {
    id: 'quiz',
    name: 'Квиз',
    category: 'Викторина',
    description: 'Проверьте знания вместе',
    longDescription: 'Увлекательные вопросы на разные темы. Узнайте, кто из вас эрудит!',
    shortReason: 'Проверка эрудиции • До 15 мин',
    iconName: 'brain',
    path: '/games/quiz',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    image: 'https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'medium',
    players: '2-4',
    playersText: '2-4 игрока',
    duration: '15 мин',
    featured: true
  },
  {
    id: 'poker',
    name: 'Покер',
    category: 'Карточные',
    description: 'Карточная игра на удачу и мастерство',
    longDescription: 'Классический покер с элементами блефа и стратегии. Почувствуйте себя в казино!',
    shortReason: 'Блеф и стратегия • Для компании',
    iconName: 'sparkles',
    path: '/games/poker',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    image: 'https://images.pexels.com/photos/1871508/pexels-photo-1871508.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'hard',
    players: '2-6',
    playersText: '2-6 игроков',
    duration: '45 мин'
  },
  {
    id: 'memory',
    name: 'Мемори',
    category: 'Память',
    description: 'Тренируйте память вместе',
    longDescription: 'Найдите все пары карточек и покажите свою феноменальную память!',
    shortReason: 'Тренировка памяти • Всего 10 мин',
    iconName: 'zap',
    path: '/games/memory',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    image: 'https://images.pexels.com/photos/1040157/pexels-photo-1040157.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'easy',
    players: '2',
    playersText: '2 игрока',
    duration: '10 мин'
  },
  {
    id: 'wordle',
    name: 'Wordle',
    category: 'Слова',
    description: 'Угадайте слово за 6 попыток',
    longDescription: 'Популярная игра в слова. Используйте логику и интуицию, чтобы угадать загаданное слово!',
    shortReason: 'Игра в слова • Логика и интуиция',
    iconName: 'trophy',
    path: '/games/wordle',
    gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    image: 'https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'medium',
    players: '1-2',
    playersText: '1-2 игрока',
    duration: '10 мин',
    featured: true
  },
  {
    id: 'codenames',
    name: 'Codenames',
    category: 'Командная',
    description: 'Игра с ассоциациями для команд',
    longDescription: 'Командная игра на ассоциации. Капитаны дают подсказки, а игроки отгадывают слова!',
    shortReason: 'Командная работа • Ассоциации',
    iconName: 'eye',
    path: '/games/codenames',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    image: 'https://images.pexels.com/photos/3183132/pexels-photo-3183132.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
    difficulty: 'medium',
    players: '4',
    playersText: '4 игрока',
    duration: '20 мин',
    featured: true
  }
];

export const CATEGORIES = ['Все', 'Классика', 'Стратегия', 'Викторина', 'Карточные', 'Память', 'Слова', 'Командная'];

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return '#4CAF50';
    case 'medium': return '#FF9800';
    case 'hard': return '#F44336';
    default: return '#9E9E9E';
  }
};

export const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'Легко';
    case 'medium': return 'Средне';
    case 'hard': return 'Сложно';
    default: return 'Неизвестно';
  }
};

export const getRandomGame = () => {
  const randomIndex = Math.floor(Math.random() * GAMES.length);
  return GAMES[randomIndex];
};