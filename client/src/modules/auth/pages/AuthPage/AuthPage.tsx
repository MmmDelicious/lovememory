import React, { useState } from 'react';
import { useAuthActions, useAuthPageData } from '../../../../store/hooks';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useInteractiveMascot } from '../../../../shared/mascot/hooks/useInteractiveMascot';
import { useAuthForm } from '../../hooks/useAuthForm';
import Button from '../../../../shared/components/Button/Button';
import StaticMascot from '../../../../shared/mascot/StaticMascot/StaticMascot';
import GenderSelector from '../../../users/components/GenderSelector/GenderSelector';
import greetAnimation from '../../../../shared/assets/greet.json';
import styles from './AuthPage.module.css';

type AuthMode = 'login' | 'register';

const mascotConfigs = {
  login: {
    initialMessage: 'С возвращением! Ваши воспоминания ждут.',
    phrases: { 
      error: ['Эй, что-то не так! Проверьте email и пароль.', 'Ой-ой! Кажется, данные неверные.', 'Стоп! Такого пользователя не существует или пароль неправильный.'], 
      idle: ['Задумались? Я подожду.'],
      story: ['Рада видеть вас снова!', 'Сколько новых воспоминаний накопилось?']
    }
  },
  register: {
    initialMessage: 'Добро пожаловать в LoveMemory! Заполните анкету для создания аккаунта.',
    phrases: {
      error: ['Ой! Кажется, такой email уже зарегистрирован. Попробуйте другой или войдите в существующий аккаунт.', 'Стоп! Проверьте все поля - что-то не так.', 'Хм, анкета заполнена некорректно. Попробуйте ещё раз!'],
      idle: ['Не спешите, заполните анкету внимательно.', 'LoveMemory поможет вам создавать особенные моменты вместе!'],
      story: ['Отлично! Анкета заполнена!', 'Добро пожаловать в LoveMemory!', 'Готовы создавать незабываемые воспоминания?']
    }
  }
};

const AuthPage: React.FC = () => {

  const location = useLocation();

  
  const [mode, setMode] = useState<AuthMode>(() => {
    const currentPath = location.pathname;
    if (currentPath === '/register') {
      return 'register';
    } else {
      return 'login';
    }
  });
  
  const { loginUser, registerUser } = useAuthActions();

  
  const { user } = useAuthPageData();
  
  const navigate = useNavigate();
  
  const mascotConfig = React.useMemo(() => {
    return mascotConfigs[mode];
  }, [mode]);
  
  const { mascotMessage, handleAvatarClick, handleInteraction, triggerError } = useInteractiveMascot(mascotConfig);

  
  // Мемоизируем onSubmit и onSuccess чтобы избежать ненужных ререндеров useAuthForm
  const onSubmit = React.useMemo(() => {
    return mode === 'login' ? loginUser : registerUser;
  }, [mode, loginUser, registerUser]);
  
  const onSuccess = React.useCallback(() => {
    navigate(mode === 'login' ? '/dashboard' : '/onboarding/interests');
  }, [mode, navigate]);
  
  const stableTriggerError = React.useCallback(triggerError, [triggerError]);
  const stableHandleInteraction = React.useCallback(handleInteraction, [handleInteraction]);
  
  const { formData, fieldErrors, isSubmitting, handleInputChange, handleSubmit } = useAuthForm({
    mode,
    onSubmit,
    onSuccess,
    triggerError: stableTriggerError,
    handleInteraction: stableHandleInteraction
  });
  


  // Обработка Google OAuth ошибок
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'google-auth-failed') {
      triggerError('Не удалось войти с помощью Google. Попробуйте снова.');
      navigate(`/${mode}`, { replace: true });
    }
  }, [location.search, mode, navigate, triggerError]);

  // Редирект если пользователь уже авторизован
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  React.useEffect(() => {
    const currentPath = location.pathname;
    
    if (currentPath === '/register' && mode !== 'register') {
      setMode('register');
    } else if (currentPath === '/login' && mode !== 'login') {
      setMode('login');
    }
  }, [location.pathname, mode, setMode]);

  const handleGoogleSignIn = (): void => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (apiBaseUrl) {
      window.open(`${apiBaseUrl}/auth/google`, '_self');
    }
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    navigate(`/${newMode}`, { replace: true });
  };

  return (
    <div className={styles.page}>
      {/* Левая панель - брендинг */}
      <div className={styles.brandingPanel}>
        <div className={styles.brandingContent}>
          {/* 3D Сердце */}
          <div className={styles.heart3D}>
            <div className={styles.heartGlow}></div>
          </div>
          
          <h1 className={styles.brandingTitle}>
            LoveMemory <span className={styles.heartIcon}>💕</span>
          </h1>
          <p className={styles.brandingText}>
            Все самые важные моменты вашей истории в одном месте.
          </p>
        </div>
      </div>

      {/* Правая панель - форма */}
      <div className={styles.formPanel}>
        <div className={`${styles.authContainer} ${mode === 'register' ? styles.register : ''}`}>
          <div className={mode === 'register' ? styles.mascotContainer : styles.mascotPositioner}>
            <StaticMascot
              bubbleKey={mascotMessage}
              message={mascotMessage}
              animationData={greetAnimation}
              onAvatarClick={handleAvatarClick}
              isError={!!fieldErrors.email || !!fieldErrors.password} // Пример: тряска при ошибках в полях
              mode={mode}
            />
          </div>

          <div className={mode === 'register' ? styles.header : ''}>
            <h1 className={`${styles.title} ${mode === 'register' ? styles.register : ''}`}>
              {mode === 'login' ? 'LoveMemory' : 'Анкета участника'}
            </h1>
            <p className={`${styles.subtitle} ${mode === 'register' ? styles.register : ''}`}>
              {mode === 'login' ? 'Войдите, чтобы продолжить' : 'Заполните данные для поиска пары'}
            </p>
          </div>

          {mode === 'register' ? (
            <div className={styles.formScroll}>
              <form onSubmit={handleSubmit} className={styles.form} noValidate>
                <div className={styles.formGrid}>
                  <input
                    name="name"
                    type="text"
                    placeholder="Ваше имя"
                    className={`${styles.input} ${styles.register} ${fieldErrors.name ? `${styles.inputError} ${styles.register}` : ''}`}
                    value={formData.name || ''}
                    onChange={handleInputChange}
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    className={`${styles.input} ${styles.register} ${fieldErrors.email ? `${styles.inputError} ${styles.register}` : ''}`}
                    value={formData.email || ''}
                    onChange={handleInputChange}
                  />
                  <input
                    name="password"
                    type="password"
                    placeholder="Пароль (мин. 6 симв.)"
                    className={`${styles.input} ${styles.register} ${fieldErrors.password ? `${styles.inputError} ${styles.register}` : ''}`}
                    value={formData.password || ''}
                    onChange={handleInputChange}
                  />
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Подтвердите пароль"
                    className={`${styles.input} ${styles.register} ${fieldErrors.confirmPassword ? `${styles.inputError} ${styles.register}` : ''}`}
                    value={formData.confirmPassword || ''}
                    onChange={handleInputChange}
                  />
                  <div className={styles.gridSpanFull}>
                    <GenderSelector
                      selectedGender={formData.gender || 'male'}
                      onGenderChange={(gender: 'male' | 'female' | 'other') => 
                        handleInputChange({ target: { name: 'gender', value: gender } } as any)
                      }
                    />
                  </div>
                  <input
                    name="city"
                    type="text"
                    placeholder="Город"
                    className={`${styles.input} ${styles.register} ${fieldErrors.city ? `${styles.inputError} ${styles.register}` : ''}`}
                    value={formData.city || ''}
                    onChange={handleInputChange}
                  />
                  <input
                    name="age"
                    type="number"
                    placeholder="Возраст (18+)"
                    className={`${styles.input} ${styles.register} ${fieldErrors.age ? `${styles.inputError} ${styles.register}` : ''}`}
                    value={formData.age || ''}
                    onChange={handleInputChange}
                    min="18"
                    max="99"
                  />
                </div>
                <Button type="primary" submit size="sm" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Отправляем...' : 'Отправить анкету'}
                </Button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.formColumn}>
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
                  value={formData.email || ''}
                  onChange={handleInputChange}
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Пароль"
                  className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
                  value={formData.password || ''}
                  onChange={handleInputChange}
                />
              </div>
              <Button type="primary" submit size="sm" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'Входим...' : 'Войти'}
              </Button>
            </form>
          )}

          <div className={`${styles.divider} ${mode === 'register' ? styles.register : ''}`}><span>ИЛИ</span></div>

          <button className={styles.googleButton} type="button" onClick={handleGoogleSignIn} disabled={isSubmitting}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
              <path d="M16.51 8.25H9.03v3.44h4.15c-.16 1.12-1.29 2.5-4.15 2.5-2.49 0-4.5-2.02-4.5-4.5s2.01-4.5 4.5-4.5c1.23 0 2.22.45 2.97 1.15l2.76-2.76C14.01 1.25 11.66 0 9.03 0 4.05 0 0 4.05 0 9s4.05 9 9.03 9c5.04 0 8.78-3.67 8.78-8.75 0-.62-.07-1.22-.19-1.8z" fill="#FFF" />
            </svg>
            <span>Войти с помощью Google</span>
          </button>

          <p className={styles.linkText}>
            {mode === 'login' ? (
              <>Нет аккаунта? <button type="button" className={styles.switchButton} onClick={() => handleModeSwitch('register')}>Создать</button></>
            ) : (
              <>Уже есть аккаунт? <button type="button" className={styles.switchButton} onClick={() => handleModeSwitch('login')}>Войти</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
