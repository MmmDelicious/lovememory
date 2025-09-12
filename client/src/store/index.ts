// Store exports - для упрощения импортов из store
// Вместо import { useUser } from '../../../store/hooks'
// Можно import { useUser } from '@/store'

// Hooks
export * from './hooks';

// Store  
export { store } from './store';
export type { RootState, AppDispatch } from './store';

// Slices
export * from './slices/authSlice';
export * from './slices/gameSlice';
export * from './slices/mascotSlice';
export * from './slices/eventMascotSlice';