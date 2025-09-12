// Auth module exports

// Pages (тонкие страницы)
export { default as AuthPage } from './pages/AuthPage/AuthPage';
export { default as AuthCallbackPage } from './pages/AuthCallbackPage/AuthCallbackPage';

// Modules (самостоятельные модули с бизнес-логикой)
export * from './modules';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useAuthForm } from './hooks/useAuthForm';

// Services
export { authService } from './services/auth.service.js';
export { authSlice } from './store/authSlice'
