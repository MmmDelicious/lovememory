// Auth module exports - прямые импорты
export { default as AuthPage } from './pages/AuthPage/AuthPage'
export { default as AuthCallbackPage } from './pages/AuthCallbackPage/AuthCallbackPage'

export { useAuth } from './hooks/useAuth'
export { useAuthForm } from './hooks/useAuthForm'

export { authService } from './services/auth.service.js'
export { authSlice } from './store/authSlice'
