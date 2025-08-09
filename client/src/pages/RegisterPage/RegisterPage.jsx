import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useInteractiveMascot } from '../../hooks/useInteractiveMascot';
import Button from '../../components/Button/Button';
import StaticMascot from '../../components/StaticMascot/StaticMascot';
import GenderSelector from '../../components/GenderSelector/GenderSelector';
import greetAnimation from '../../assets/greet.json';
import styles from '../../styles/AuthLayout.module.css';

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
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    handleInteraction();
  };

  const handleGenderChange = (gender) => {
    setFormData((prev) => ({ ...prev, gender }));
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
      await register({
        email,
        password,
        first_name: firstName,
        gender,
        age: parseInt(age, 10),
        city,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Что-то пошло не так при регистрации.';
      triggerError(errorMessage);
    }
  };

  const handleGoogleSignIn = () => {
    const googleLoginURL = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
    window.open(googleLoginURL, '_blank', 'width=500,height=600,noreferrer');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={`${styles.authWrapper} ${styles.isRegister}`}>
        <div className={styles.mascotPositioner}>
          <StaticMascot bubbleKey={mascotMessage} message={mascotMessage} animationData={greetAnimation} onAvatarClick={handleAvatarClick} />
        </div>
        <div className={styles.authBox}>
          <h1 className={styles.title}>Создание аккаунта</h1>
          <p className={styles.subtitle}>Заполните поля, чтобы начать вашу историю</p>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.formGrid}>
              <input name="firstName" type="text" placeholder="Ваше имя" className={`${styles.input} ${styles.gridSpan2}`} value={formData.firstName} onChange={handleInputChange} />
              <input name="email" type="email" placeholder="Email" className={`${styles.input} ${styles.gridSpan2}`} value={formData.email} onChange={handleInputChange} />
              <input name="password" type="password" placeholder="Пароль (мин. 6 символов)" className={`${styles.input} ${styles.gridSpan2}`} value={formData.password} onChange={handleInputChange} />
              <div className={styles.gridSpan2}>
                <GenderSelector selectedGender={formData.gender} onGenderChange={handleGenderChange} />
              </div>
              <input name="age" type="number" placeholder="Возраст" className={styles.input} value={formData.age} onChange={handleInputChange} />
              <input name="city" type="text" placeholder="Город" className={styles.input} value={formData.city} onChange={handleInputChange} />
            </div>
            <Button type="primary" submit className={styles.fullWidth}>Зарегистрироваться</Button>
          </form>
          <div className={styles.divider}><span>ИЛИ</span></div>
          <button className={styles.googleButton} type="button" onClick={handleGoogleSignIn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18"><path d="M16.51 8.25H9.03v3.44h4.15c-.16 1.12-1.29 2.5-4.15 2.5-2.49 0-4.5-2.02-4.5-4.5s2.01-4.5 4.5-4.5c1.23 0 2.22.45 2.97 1.15l2.76-2.76C14.01 1.25 11.66 0 9.03 0 4.05 0 0 4.05 0 9s4.05 9 9.03 9c5.04 0 8.78-3.67 8.78-8.75 0-.62-.07-1.22-.19-1.8z" fill="#FFF"></path></svg>
            <span>Войти с помощью Google</span>
          </button>
          <p className={styles.linkText}>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;