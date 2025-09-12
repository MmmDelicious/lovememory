import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import gameSlice from './slices/gameSlice'; 
import mascotSlice from './slices/mascotSlice';
import eventMascotSlice from './slices/eventMascotSlice';
// import { socketMiddleware } from './middleware/socketMiddleware';

/**
 * Настоящий Redux store
 * Убираем все циклические зависимости
 */
export const store = configureStore({
  reducer: {
    auth: authSlice,
    game: gameSlice,
    mascot: mascotSlice,
    eventMascot: eventMascotSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
