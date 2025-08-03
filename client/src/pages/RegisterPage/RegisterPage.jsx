import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInteractiveMascot } from '../../hooks/useInteractiveMascot';
import authService from '../../services/auth.service';
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
  const [formData, setFormData] = useState({
    firstName: '', email: '', password: '', gender: '', age: '', city: '',
  });
  const navigate = useNavigate();
  const { mascotMessage, handleAvatarClick, handleInteraction, triggerError } = useInteractiveMascot(mascotConfig);

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
    if (!age || age < 18 || age > 99) return triggerError('Укажите возраст от 18 до 99.');
    if (!city) return triggerError('Из какого вы города?');
    try {
      await authService.register(email, password, firstName, gender, parseInt(age, 10), city);
      navigate('/login');
    } catch (err) {
      triggerError(err.response?.data?.message || 'Что-то пошло не так при регистрации.');
    }
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
              <input name="firstName" type="text" placeholder="Ваше имя" className={styles.input} value={formData.firstName} onChange={handleInputChange} />
              <input name="email" type="email" placeholder="Email" className={styles.input} value={formData.email} onChange={handleInputChange} />
              <input name="password" type="password" placeholder="Пароль (мин. 6 символов)" className={styles.input} value={formData.password} onChange={handleInputChange} />
              <GenderSelector selectedGender={formData.gender} onGenderChange={handleGenderChange} />
              <input name="age" type="number" placeholder="Возраст" className={styles.input} value={formData.age} onChange={handleInputChange} />
              <input name="city" type="text" placeholder="Город" className={styles.input} value={formData.city} onChange={handleInputChange} />
            </div>
            <Button type="primary" submit className={styles.fullWidth}>Зарегистрироваться</Button>
          </form>
          <p className={styles.linkText}>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;