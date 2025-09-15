// Auth module exports

// Pages (тонкие страницы)
export { default as AuthPage } from './pages/AuthPage/AuthPage';
export { default as AuthCallbackPage } from './pages/AuthCallbackPage/AuthCallbackPage';

// Modules (самостоятельные модули с бизнес-логикой)
export * from './modules';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useAuthForm } from './hooks/useAuthForm';

// Services - use unified API
export { authAPI as authService } from '@api/auth';
export { authSlice } from './store/authSlice'
