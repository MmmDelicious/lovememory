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
    city: '',
    age: ''
  });
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [isError, setIsError] = useState(false);
  
  const { registerUser } = useAuthActions();
  const navigate = useNavigate();
  const { mascotMessage, handleAvatarClick, handleInteraction, triggerError } = useInteractiveMascot(mascotConfig);
  
  // Обработчик ошибок с анимацией
  const handleError = (message: string) => {
    setIsError(true);
    triggerError(message);
    setTimeout(() => setIsError(false), 1000);
  };
  

  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldName = e.target.name;
    setFormData((prev) => ({ ...prev, [fieldName]: e.target.value }));
    
    // Убираем ошибку с поля при вводе
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({ ...prev, [fieldName]: false }));
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
    
    if (!formData.name.trim()) {
      errors.name = true;
      errorMessage = 'Введите ваше имя';
    } else if (!formData.email.trim()) {
      errors.email = true;
      errorMessage = 'Введите email';
    } else if (!formData.password) {
      errors.password = true;
      errorMessage = 'Введите пароль';
    } else if (formData.password.length < 6) {
      errors.password = true;
      errorMessage = 'Пароль должен быть не менее 6 символов';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = true;
      errorMessage = 'Пароли не совпадают';
    } else if (!formData.city.trim()) {
      errors.city = true;
      errorMessage = 'Введите ваш город';
    } else if (!formData.age || isNaN(parseInt(formData.age)) || parseInt(formData.age) < 18 || parseInt(formData.age) > 99) {
      errors.age = true;
      errorMessage = 'Возраст должен быть от 18 до 99 лет';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return handleError(errorMessage);
    }
    
    try {
      await registerUser({
        email: formData.email,
        password: formData.password,
        first_name: formData.name,
        gender: formData.gender,
        city: formData.city,
        age: parseInt(formData.age)
      }).unwrap();
      
      // Успешная регистрация
      navigate('/onboarding/interests');
    } catch (err: any) {
      // Ошибка регистрации
      const errorMessage = err || 'Ошибка регистрации';
      
      // Подсвечиваем соответствующие поля в зависимости от ошибки
      const serverErrors: Record<string, boolean> = {};
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        serverErrors.email = true;
      }
      if (errorMessage.includes('пароль') || errorMessage.includes('Пароль')) {
        serverErrors.password = true;
      }
      if (errorMessage.includes('возраст') || errorMessage.includes('Возраст')) {
        serverErrors.age = true;
      }
      if (errorMessage.includes('город') || errorMessage.includes('Город')) {
        serverErrors.city = true;
      }
      if (errorMessage.includes('имя') || errorMessage.includes('Имя')) {
        serverErrors.name = true;
      }
      
      setFieldErrors(serverErrors);
      handleError(errorMessage);
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
    
    // Убираем ошибку с поля при изменении
    if (fieldErrors.gender) {
      setFieldErrors(prev => ({ ...prev, gender: false }));
    }
    
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
            isError={isError}
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
              className={`${loginStyles.input} ${fieldErrors.name ? loginStyles.inputError : ''}`} 
              value={formData.name} 
              onChange={handleInputChange} 
            />
            <input 
              name="email" 
              type="email" 
              placeholder="Email" 
              className={`${loginStyles.input} ${fieldErrors.email ? loginStyles.inputError : ''}`} 
              value={formData.email} 
              onChange={handleInputChange} 
            />
            <input 
              name="password" 
              type="password" 
              placeholder="Пароль (мин. 6 симв.)" 
              className={`${loginStyles.input} ${fieldErrors.password ? loginStyles.inputError : ''}`} 
              value={formData.password} 
              onChange={handleInputChange} 
            />
            <input 
              name="confirmPassword" 
              type="password" 
              placeholder="Подтвердите пароль" 
              className={`${loginStyles.input} ${fieldErrors.confirmPassword ? loginStyles.inputError : ''}`} 
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
              className={`${loginStyles.input} ${fieldErrors.city ? loginStyles.inputError : ''}`} 
              value={formData.city} 
              onChange={handleInputChange} 
            />
            <input 
              name="age" 
              type="number" 
              placeholder="Возраст (18+)" 
              className={`${loginStyles.input} ${fieldErrors.age ? loginStyles.inputError : ''}`} 
              value={formData.age} 
              onChange={handleInputChange}
              min="18"
              max="99"
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
