import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '../modules/auth/store/authSlice';
import gameSlice from './slices/gameSlice'; 
import mascotSlice from './slices/mascotSlice';
import eventMascotSlice from './slices/eventMascotSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
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
