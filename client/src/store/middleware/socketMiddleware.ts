import { createListenerMiddleware } from '@reduxjs/toolkit';
import { connectToGameSocket, setGameState, setConnectionStatus } from '../slices/gameSlice';
import type { AppDispatch } from '../index';

// Создаем listener middleware для WebSocket
export const socketMiddleware = createListenerMiddleware<AppDispatch>();

// Слушаем подключение к игре
socketMiddleware.startListening({
  actionCreator: connectToGameSocket.fulfilled,
  effect: async (action, listenerApi) => {
    const { roomId } = action.payload;
    
    try {
      // Здесь будет реальное WebSocket подключение
      // Пока используем заглушку
      console.log(`Connecting to game room: ${roomId}`);
      
      // Устанавливаем статус подключения
      listenerApi.dispatch(setConnectionStatus(true));
      
      // Симулируем получение обновлений игры
      setInterval(() => {
        // В реальном приложении здесь будут WebSocket события
        console.log('Game state update received');
      }, 5000);
      
    } catch (error) {
      console.error('Failed to connect to game socket:', error);
      listenerApi.dispatch(setConnectionStatus(false));
    }
  },
});

// Middleware для обработки WebSocket событий
export const socketMiddlewareConfig = {
  middleware: socketMiddleware.middleware,
};
