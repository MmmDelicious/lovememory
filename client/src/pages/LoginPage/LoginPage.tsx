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
  const { loginUser } = useAuthActions();
  const user = useUser(); // Получаем пользователя из Redux
  const navigate = useNavigate();
  const location = useLocation();
  const { mascotMessage, handleAvatarClick, handleInteraction, triggerError } = useInteractiveMascot(mascotConfig);
  
  React.useEffect(() => {
    // Если пользователь уже авторизован, перенаправляем на dashboard
    if (user) {
      console.log('✅ Пользователь уже авторизован, перенаправляем на dashboard');
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'google-auth-failed') {
      triggerError('Не удалось войти с помощью Google. Попробуйте снова.');
      navigate('/login', { replace: true });
    }
  }, [location, navigate, triggerError]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return triggerError('Нужен и email, и пароль.');
    
    console.log('🚀 Попытка входа с:', { email, password });
    
    try {
      await loginUser({ email, password });
      console.log('✅ Вход выполнен, пользователь в Redux:', user);
      
      // Проверяем, что токен сохранился
      const savedToken = localStorage.getItem('authToken');
      console.log('💾 Токен в localStorage:', savedToken ? 'Сохранен' : 'НЕ сохранен');
      
      // Даем время Redux обновиться, затем перенаправляем
      setTimeout(() => {
        console.log('🔄 Перенаправляем на dashboard после обновления Redux');
        navigate('/dashboard');
      }, 100);
      
    } catch (err: any) {
      console.error('❌ Ошибка входа:', err);
      triggerError(err.response?.data?.message || 'Неверный email или пароль.');
    }
  };
  const handleGoogleSignIn = () => {
    window.open(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, '_self');
  };
  return (
    <AuthLayout>
      <div className={styles.authBox}>
        <div className={styles.mascotPositioner}>
          <StaticMascot bubbleKey={mascotMessage} message={mascotMessage} animationData={greetAnimation} onAvatarClick={handleAvatarClick} />
        </div>
        <h1 className={styles.title}>LoveMemory</h1>
        <p className={styles.subtitle}>Войдите, чтобы продолжить</p>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <input 
            type="email" 
            placeholder="Email" 
            className={styles.input} 
            value={email} 
            onChange={(e) => { setEmail(e.target.value); handleInteraction(); }} 
          />
          <input 
            type="password" 
            placeholder="Пароль" 
            className={styles.input} 
            value={password} 
            onChange={(e) => { setPassword(e.target.value); handleInteraction(); }} 
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

