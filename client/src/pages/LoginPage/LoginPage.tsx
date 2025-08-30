import React, { useState } from 'react';
import { useAuthActions, useUser } from '../../store/hooks';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useInteractiveMascot } from '../../hooks/useInteractiveMascot';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Button from '../../components/Button/Button';
import StaticMascot from '../../components/StaticMascot/StaticMascot';
import greetAnimation from '../../assets/greet.json';
import styles from './LoginPage.module.css';

const mascotConfig = {
  initialMessage: 'С возвращением! Ваши воспоминания ждут.',
  phrases: { error: ['Хм, что-то не так. Проверьте данные.'], idle: ['Задумались? Я подожду.'] }
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [isError, setIsError] = useState(false);
  
  const { loginUser } = useAuthActions();
  const user = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { mascotMessage, handleAvatarClick, handleInteraction, triggerError } = useInteractiveMascot(mascotConfig);
  
  // Обработчик ошибок с анимацией
  const handleError = (message: string) => {
    setIsError(true);
    triggerError(message);
    setTimeout(() => setIsError(false), 1000);
  };
  
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'google-auth-failed') {
      handleError('Не удалось войти с помощью Google. Попробуйте снова.');
      navigate('/login', { replace: true });
    }
  }, [location, navigate, handleError]);
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: false }));
    }
    handleInteraction();
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: false }));
    }
    handleInteraction();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Сброс ошибок
    setFieldErrors({});
    
    // Валидация полей
    const errors: Record<string, boolean> = {};
    let errorMessage = '';
    
    if (!email.trim()) {
      errors.email = true;
      errorMessage = 'Введите email';
    }
    
    if (!password) {
      errors.password = true;
      if (!errorMessage) errorMessage = 'Введите пароль';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return handleError(errorMessage);
    }
    
    try {
      await loginUser({ email, password });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Неверный email или пароль';
      
      // Подсвечиваем соответствующие поля в зависимости от ошибки
      const serverErrors: Record<string, boolean> = {};
      if (errorMessage.includes('email') || errorMessage.includes('Email') || errorMessage.includes('пользователь')) {
        serverErrors.email = true;
      }
      if (errorMessage.includes('пароль') || errorMessage.includes('Пароль') || errorMessage.includes('password')) {
        serverErrors.password = true;
      }
      
      setFieldErrors(serverErrors);
      handleError(errorMessage);
    }
  };
  const handleGoogleSignIn = () => {
    window.open(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, '_self');
  };
  return (
    <AuthLayout>
      <div className={styles.authBox}>
        <div className={styles.mascotPositioner}>
          <StaticMascot 
            bubbleKey={mascotMessage} 
            message={mascotMessage} 
            animationData={greetAnimation} 
            onAvatarClick={handleAvatarClick}
            isError={isError}
          />
        </div>
        <h1 className={styles.title}>LoveMemory</h1>
        <p className={styles.subtitle}>Войдите, чтобы продолжить</p>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <input 
            type="email" 
            placeholder="Email" 
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`} 
            value={email} 
            onChange={handleEmailChange} 
          />
          <input 
            type="password" 
            placeholder="Пароль" 
            className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`} 
            value={password} 
            onChange={handlePasswordChange} 
          />
          <Button type="primary" submit>Войти</Button>
        </form>
        <div className={styles.divider}><span>ИЛИ</span></div>
        <button className={styles.googleButton} type="button" onClick={handleGoogleSignIn}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
            <path d="M16.51 8.25H9.03v3.44h4.15c-.16 1.12-1.29 2.5-4.15 2.5-2.49 0-4.5-2.02-4.5-4.5s2.01-4.5 4.5-4.5c1.23 0 2.22.45 2.97 1.15l2.76-2.76C14.01 1.25 11.66 0 9.03 0 4.05 0 0 4.05 0 9s4.05 9 9.03 9c5.04 0 8.78-3.67 8.78-8.75 0-.62-.07-1.22-.19-1.8z" fill="#FFF" />
          </svg>
          <span>Войти с помощью Google</span>
        </button>
        <p className={styles.linkText}>Нет аккаунта? <Link to="/register">Создать</Link></p>
      </div>
    </AuthLayout>
  );
};
export default LoginPage;

