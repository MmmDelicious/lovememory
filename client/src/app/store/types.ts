import { GameState, GameRoom, Player } from '../../types/game.types';

// Типы для игрового состояния
export interface GameSliceState {
  // Текущая игра
  currentGame: GameRoom | null;
  gameState: GameState | null;
  
  // Игровые комнаты
  rooms: GameRoom[];
  loadingRooms: boolean;
  
  // WebSocket соединение
  socket: any | null;
  isConnected: boolean;
  
  // Игровые настройки
  selectedGameType: string;
  selectedTableType: 'standard' | 'premium' | 'elite';
  
  // Состояние загрузки
  isLoading: boolean;
  error: string | null;
}

// Типы для масотов
export interface MascotSliceState {
  // Глобальный масот
  globalMascot: {
    position: { x: number; y: number };
    direction: 'left' | 'right';
    message: string;
    animationData?: any;
  };
  
  // AI масот
  isAIVisible: boolean;
  isChatOpen: boolean;
  isAILoading: boolean;
  
  // Перехваченный масот
  interceptedMascot: any | null;
  
  // Генератор дат
  isDateGeneratorOpen: boolean;
  
  // Мобильное состояние
  isMobile: boolean;
}

// Типы для actions
export interface SetGameStatePayload {
  gameState: GameState;
}

export interface SetRoomsPayload {
  rooms: GameRoom[];
}

export interface SetSocketPayload {
  socket: any;
}

export interface SetMascotPositionPayload {
  position: { x: number; y: number };
}

export interface SetMascotMessagePayload {
  message: string;
  duration?: number;
}
export interface UserSettingsState {
  // Подсказка: добавь поля для звука, анимаций, языка
  soundEnabled: boolean;
  animationsEnabled: boolean;
  language: string;
  showTimer: boolean;
  autoFold: boolean;
}

// Интерфейс для ошибок в играх
export interface GameError {
  type: 'network' | 'game' | 'validation';
  message: string;
  code?: number;
  timestamp: Date;
  details?: string;
}