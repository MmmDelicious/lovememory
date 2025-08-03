import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const { login } = useAuth();
  const navigate = useNavigate();
  const { mascotMessage, handleAvatarClick, handleInteraction, triggerError } = useInteractiveMascot(mascotConfig);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return triggerError('Нужен и email, и пароль.');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      triggerError(err.response?.data?.message || 'Неверный email или пароль.');
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    handleInteraction();
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.authWrapper}>
        <div className={styles.mascotPositioner}>
          <StaticMascot bubbleKey={mascotMessage} message={mascotMessage} animationData={greetAnimation} onAvatarClick={handleAvatarClick} />
        </div>
        <div className={styles.authBox}>
          <h1 className={styles.title}>MemoryLove</h1>
          <p className={styles.subtitle}>Войдите, чтобы продолжить</p>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <input type="email" placeholder="Email" className={styles.input} value={email} onChange={handleInputChange(setEmail)} />
            <input type="password" placeholder="Пароль" className={styles.input} value={password} onChange={handleInputChange(setPassword)} />
            <Button type="primary" submit>Войти</Button>
          </form>
          <p className={styles.linkText}>Нет аккаунта? <Link to="/register">Создать</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;