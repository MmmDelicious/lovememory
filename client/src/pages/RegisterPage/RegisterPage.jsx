import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useInteractiveMascot } from '../../hooks/useInteractiveMascot';
import AuthLayout from '../../layouts/AuthLayout/AuthLayout';
import Button from '../../components/Button/Button';
import StaticMascot from '../../components/StaticMascot/StaticMascot';
import GenderSelector from '../../components/GenderSelector/GenderSelector';
import greetAnimation from '../../assets/greet.json';
import styles from './RegisterPage.module.css';
import loginStyles from '../LoginPage/LoginPage.module.css'; 

const mascotConfig = {
  initialMessage: 'Привет! Давайте создадим ваш уголок воспоминаний.',
  phrases: { error: ['Кажется, что-то упустили. Проверьте, пожалуйста.'], idle: ['Не торопитесь, я подожду.'] }
};

const RegisterPage = () => {
  const [formData, setFormData] = useState({ firstName: '', email: '', password: '', gender: '', age: '', city: '' });
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { mascotMessage, handleAvatarClick, handleInteraction, triggerError } = useInteractiveMascot(mascotConfig);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    handleInteraction();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, email, password, gender, age, city } = formData;
    if (!firstName) return triggerError('Как вас зовут?');
    if (!email) return triggerError('Без email никак, нужен для входа.');
    if (password.length < 6) return triggerError('Пароль должен быть надежным, минимум 6 символов.');
    if (!gender) return triggerError('Выберите ваш пол.');
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 99) return triggerError('Укажите возраст от 18 до 99.');
    if (!city) return triggerError('Из какого вы города?');
    try {
      await register({ email, password, first_name: firstName, gender, age: ageNum, city });
      navigate('/dashboard');
    } catch (err) {
      triggerError(err.response?.data?.message || 'Что-то пошло не так.');
    }
  };

  const handleGoogleSignIn = () => {
    window.open(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, '_self');
  };

  return (
    <AuthLayout>
      <div className={`${loginStyles.authBox} ${styles.registerBox}`}>
        <div className={loginStyles.mascotPositioner}>
            <StaticMascot bubbleKey={mascotMessage} message={mascotMessage} animationData={greetAnimation} onAvatarClick={handleAvatarClick} />
        </div>
        <h1 className={loginStyles.title}>Создание аккаунта</h1>
        <p className={loginStyles.subtitle}>Заполните поля, чтобы начать вашу историю</p>
        <form onSubmit={handleSubmit} className={loginStyles.form} noValidate>
          <div className={styles.formGrid}>
            <input name="firstName" type="text" placeholder="Ваше имя" className={loginStyles.input} value={formData.firstName} onChange={handleInputChange} />
            <input name="email" type="email" placeholder="Email" className={loginStyles.input} value={formData.email} onChange={handleInputChange} />
            <input name="password" type="password" placeholder="Пароль (мин. 6 симв.)" className={loginStyles.input} value={formData.password} onChange={handleInputChange} />
            <div className={styles.gridSpanFull}>
              <GenderSelector selectedGender={formData.gender} onGenderChange={(g) => { setFormData(p => ({...p, gender: g})); handleInteraction();}} />
            </div>
            <input name="age" type="number" placeholder="Возраст" className={loginStyles.input} value={formData.age} onChange={handleInputChange} />
            <input name="city" type="text" placeholder="Город" className={loginStyles.input} value={formData.city} onChange={handleInputChange} />
          </div>
          <Button type="primary" submit>Зарегистрироваться</Button>
        </form>
        <div className={loginStyles.divider}><span>ИЛИ</span></div>
        <button className={loginStyles.googleButton} type="button" onClick={handleGoogleSignIn}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18"><path d="M16.51 8.25H9.03v3.44h4.15c-.16 1.12-1.29 2.5-4.15 2.5-2.49 0-4.5-2.02-4.5-4.5s2.01-4.5 4.5-4.5c1.23 0 2.22.45 2.97 1.15l2.76-2.76C14.01 1.25 11.66 0 9.03 0 4.05 0 0 4.05 0 9s4.05 9 9.03 9c5.04 0 8.78-3.67 8.78-8.75 0-.62-.07-1.22-.19-1.8z" fill="#FFF"></path></svg>
          <span>Войти с помощью Google</span>
        </button>
        <p className={loginStyles.linkText}>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;