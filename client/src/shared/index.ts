// Shared exports - для упрощения импортов
// Вместо import Button from '../../../shared/components/Button/Button'
// Можно import { Button } from '@/shared'

// UI Components
export { default as Button } from './components/Button/Button';
export { default as Avatar } from './components/Avatar/Avatar';
export { default as UserAvatar } from './components/UserAvatar/UserAvatar';
export { default as Toast } from './components/Toast/Toast';
export { default as MobileNavigation } from './components/MobileNavigation/MobileNavigation';
export { default as PlayingCard } from './components/PlayingCard/PlayingCard';

// Layout Components  
export { default as MainLayout } from './layout/MainLayout/MainLayout';
export { default as GameLayout } from './layout/GameLayout/GameLayout';
export { default as MobileLayout } from './layout/MobileLayout/MobileLayout';
export { default as Sidebar } from './layout/Sidebar/Sidebar';

// Effects
export { default as NatureElements } from './effects/NatureElements/NatureElements';
export { default as ScrollElements } from './effects/NatureElements/ScrollElements';

// Hooks
export { useToast } from './hooks/useToast';

// Utils
export * from './utils/color';
export * from './utils/errorHandler';
export * from './utils/lessonUtils';

// Constants (создадим позже если понадобится)
// export * from './constants/colors';

// Types
export * from './types/global.d';