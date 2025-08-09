import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useInteractiveMascot } from '../../hooks/useInteractiveMascot';
import Button from '../../components/Button/Button';
import StaticMascot from '../../components/StaticMascot/StaticMascot';
import greetAnimation from '../../assets/greet.json';
import styles from '../../styles/AuthLayout.module.css';

const mascotConfig = {
  initialMessage: 'С возвращением! Ваши воспоминания ждут.',
  phrases: { error: ['Хм, что-то не так. Проверьте данные.'], idle: ['Задумались? Я подожду.'] }
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { mascotMessage, handleAvatarClick, handleInteraction, triggerError } = useInteractiveMascot(mascotConfig);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'google-auth-failed') {
      triggerError('Не удалось войти с помощью Google. Попробуйте снова.');
      navigate('/login', { replace: true });
    }
  }, [location, navigate, triggerError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return triggerError('Нужен и email, и пароль.');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Неверный email или пароль.';
      triggerError(errorMessage);
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    handleInteraction();
  };

  const handleGoogleSignIn = () => {
    const googleLoginURL = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
    window.open(googleLoginURL, '_blank', 'width=500,height=600,noreferrer');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.authWrapper}>
        <div className={styles.mascotPositioner}>
          <StaticMascot bubbleKey={mascotMessage} message={mascotMessage} animationData={greetAnimation} onAvatarClick={handleAvatarClick} />
        </div>
        <div className={styles.authBox}>
          <h1 className={styles.title}>LoveMemory</h1>
          <p className={styles.subtitle}>Войдите, чтобы продолжить</p>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <input type="email" placeholder="Email" className={styles.input} value={email} onChange={handleInputChange(setEmail)} />
            <input type="password" placeholder="Пароль" className={styles.input} value={password} onChange={handleInputChange(setPassword)} />
            <Button type="primary" submit>Войти</Button>
          </form>
          <div className={styles.divider}><span>ИЛИ</span></div>
          <button className={styles.googleButton} type="button" onClick={handleGoogleSignIn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18"><path d="M16.51 8.25H9.03v3.44h4.15c-.16 1.12-1.29 2.5-4.15 2.5-2.49 0-4.5-2.02-4.5-4.5s2.01-4.5 4.5-4.5c1.23 0 2.22.45 2.97 1.15l2.76-2.76C14.01 1.25 11.66 0 9.03 0 4.05 0 0 4.05 0 9s4.05 9 9.03 9c5.04 0 8.78-3.67 8.78-8.75 0-.62-.07-1.22-.19-1.8z" fill="#FFF"></path></svg>
            <span>Войти с помощью Google</span>
          </button>
          <p className={styles.linkText}>Нет аккаунта? <Link to="/register">Создать</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;