import React, { useState } from 'react';
import { useAuthActions } from '../../store/hooks';
import { Link, useNavigate } from 'react-router-dom';
import { useInteractiveMascot } from '../../hooks/useInteractiveMascot';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Button from '../../components/Button/Button';
import StaticMascot from '../../components/StaticMascot/StaticMascot';
import GenderSelector from '../../components/GenderSelector/GenderSelector';
import greetAnimation from '../../assets/greet.json';
import styles from './RegisterPage.module.css';
import loginStyles from '../LoginPage/LoginPage.module.css';
interface MascotConfig {
  initialMessage: string;
  phrases: {
    error: string[];
    idle: string[];
  };
}
const mascotConfig: MascotConfig = {
  initialMessage: 'Привет! Давайте создадим ваш уголок воспоминаний.',
  phrases: { 
    error: ['Кажется, что-то упустили. Проверьте, пожалуйста.'], 
    idle: ['Не торопитесь, я подожду.'] 
  }
};
const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'male' as 'male' | 'female' | 'other',
    city: ''
  });
  
  const { registerUser } = useAuthActions();
  const navigate = useNavigate();
  const { mascotMessage, handleAvatarClick, handleInteraction, triggerError } = useInteractiveMascot(mascotConfig);
  
  React.useEffect(() => {
    // TODO: Проверять isAuthenticated из Redux state
    // const isAuthenticated = useIsAuthenticated();
    // if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [navigate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    handleInteraction();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return triggerError('Пароли не совпадают');
    }
    
    try {
      await registerUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        first_name: formData.name,
        gender: formData.gender,
        city: formData.city
      });
      navigate('/dashboard');
    } catch (err: any) {
      triggerError(err.response?.data?.message || 'Ошибка регистрации');
    }
  };
  const handleGoogleSignIn = (): void => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (apiBaseUrl) {
      window.open(`${apiBaseUrl}/auth/google`, '_self');
    }
  };
  const handleGenderChange = (gender: 'male' | 'female' | 'other'): void => {
    setFormData((prev) => ({ ...prev, gender }));
    handleInteraction();
  };
  return (
    <AuthLayout>
      <div className={`${loginStyles.authBox} ${styles.registerBox}`}>
        <div className={loginStyles.mascotPositioner}>
          <StaticMascot 
            bubbleKey={mascotMessage} 
            message={mascotMessage} 
            animationData={greetAnimation} 
            onAvatarClick={handleAvatarClick} 
          />
        </div>
        <h1 className={loginStyles.title}>Создание аккаунта</h1>
        <p className={loginStyles.subtitle}>Заполните поля, чтобы начать вашу историю</p>
        <form onSubmit={handleSubmit} className={loginStyles.form} noValidate>
          <div className={styles.formGrid}>
            <input 
              name="name" 
              type="text" 
              placeholder="Ваше имя" 
              className={loginStyles.input} 
              value={formData.name} 
              onChange={handleInputChange} 
            />
            <input 
              name="email" 
              type="email" 
              placeholder="Email" 
              className={loginStyles.input} 
              value={formData.email} 
              onChange={handleInputChange} 
            />
            <input 
              name="password" 
              type="password" 
              placeholder="Пароль (мин. 6 симв.)" 
              className={loginStyles.input} 
              value={formData.password} 
              onChange={handleInputChange} 
            />
            <input 
              name="confirmPassword" 
              type="password" 
              placeholder="Подтвердите пароль" 
              className={loginStyles.input} 
              value={formData.confirmPassword} 
              onChange={handleInputChange} 
            />
            <div className={styles.gridSpanFull}>
              <GenderSelector 
                selectedGender={formData.gender} 
                onGenderChange={handleGenderChange}
              />
            </div>
            <input 
              name="city" 
              type="text" 
              placeholder="Город" 
              className={loginStyles.input} 
              value={formData.city} 
              onChange={handleInputChange} 
            />
          </div>
          <Button type="primary" submit>Зарегистрироваться</Button>
        </form>
        <div className={loginStyles.divider}><span>ИЛИ</span></div>
        <button className={loginStyles.googleButton} type="button" onClick={handleGoogleSignIn}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
            <path d="M16.51 8.25H9.03v3.44h4.15c-.16 1.12-1.29 2.5-4.15 2.5-2.49 0-4.5-2.02-4.5-4.5s2.01-4.5 4.5-4.5c1.23 0 2.22.45 2.97 1.15l2.76-2.76C14.01 1.25 11.66 0 9.03 0 4.05 0 0 4.05 0 9s4.05 9 9.03 9c5.04 0 8.78-3.67 8.78-8.75 0-.62-.07-1.22-.19-1.8z" fill="#FFF"></path>
          </svg>
          <span>Войти с помощью Google</span>
        </button>
        <p className={loginStyles.linkText}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </AuthLayout>
  );
};
export default RegisterPage;
