import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthPageData } from '../../../../store/hooks';
import { AuthModule } from '../../modules';
import styles from './AuthPage.module.css';

type AuthMode = 'login' | 'register';

/**
 * Тонкая страница авторизации
 * Содержит только навигационную логику, всю бизнес-логику делегирует модулю AuthModule
 */
const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthPageData();
  
  // Определение режима на основе URL
  const [mode, setMode] = useState<AuthMode>(() => {
    const currentPath = location.pathname;
    return currentPath === '/register' ? 'register' : 'login';
  });

  // Обработчики навигации
  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    navigate(`/${newMode}`, { replace: true });
  };

  const handleSuccess = (authMode: AuthMode) => {
    navigate(authMode === 'login' ? '/dashboard' : '/onboarding/interests');
  };

  const handleGoogleSignIn = (): void => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (apiBaseUrl) {
      window.open(`${apiBaseUrl}/auth/google`, '_self');
    }
  };

  // Обработка Google OAuth ошибок
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'google-auth-failed') {
      // Ошибка будет обработана в AuthModule через triggerError
      navigate(`/${mode}`, { replace: true });
    }
  }, [location.search, mode, navigate]);

  // Редирект если пользователь уже авторизован
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Синхронизация режима с URL
  useEffect(() => {
    const currentPath = location.pathname;
    
    if (currentPath === '/register' && mode !== 'register') {
      setMode('register');
    } else if (currentPath === '/login' && mode !== 'login') {
      setMode('login');
    }
  }, [location.pathname, mode]);

  return (
    <div className={styles.page}>
      <AuthModule
        mode={mode}
        onModeSwitch={handleModeSwitch}
        onSuccess={handleSuccess}
        onGoogleSignIn={handleGoogleSignIn}
      />
    </div>
  );
};

export default AuthPage;