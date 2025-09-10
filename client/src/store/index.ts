import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import mascotReducer from './slices/mascotSlice';
import eventMascotReducer from './slices/eventMascotSlice';
import authReducer from './slices/authSlice';

const store = configureStore({
  reducer: {
    game: gameReducer,
    mascot: mascotReducer,
    eventMascot: eventMascotReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Игнорируем проверку для WebSocket и других несериализуемых объектов
        ignoredActions: [
          'game/setSocket', 
          'game/updateGameState',
          'eventMascot/registerMascotTargets',
          'eventMascot/setMascotTargets'
        ],
        ignoredPaths: [
          'game.socket',
          'eventMascot.mascotTargets'
        ],
      },
    }),
  devTools: import.meta.env.DEV, // Включаем DevTools только в development
});

export { store };

// Правильная типизация без циклических ссылок
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
