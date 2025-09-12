import React, { useState, useMemo, useCallback } from 'react';
import { useAuthActions } from '../../../../store/hooks';
import { useInteractiveMascot } from '../../../../shared/mascot/hooks/useInteractiveMascot';
import { useAuthForm } from '../../hooks/useAuthForm';
import { AuthFormComponent } from '../../components/AuthForm/AuthForm';
import { AuthBranding } from '../../components/AuthBranding/AuthBranding';
import { AuthMascot } from '../../components/AuthMascot/AuthMascot';
import styles from './AuthModule.module.css';

type AuthMode = 'login' | 'register';

interface AuthModuleProps {
  mode: AuthMode;
  onModeSwitch: (mode: AuthMode) => void;
  onSuccess: (mode: AuthMode) => void;
  onGoogleSignIn: () => void;
  isSubmitting?: boolean;
  className?: string;
}

// Выносим конфигурацию маскота за пределы компонента для предотвращения пересоздания
const MASCOT_CONFIGS = {
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
} as const;

/**
 * Самостоятельный модуль авторизации с полной бизнес-логикой
 * Отвечает за: формы входа/регистрации, валидацию, маскот, состояние
 * Содержит собственное состояние, обработку ошибок, взаимодействие с API
 */
export const AuthModule: React.FC<AuthModuleProps> = ({
  mode,
  onModeSwitch,
  onSuccess,
  onGoogleSignIn,
  isSubmitting = false,
  className
}) => {
  const { loginUser, registerUser } = useAuthActions();
  
  // Маскот конфигурация - стабильная ссылка
  const mascotConfig = useMemo(() => MASCOT_CONFIGS[mode], [mode]);
  const { mascotMessage, handleAvatarClick, handleInteraction, triggerError } = useInteractiveMascot(mascotConfig);

  // Мемоизированные обработчики
  const onSubmit = useMemo(() => {
    return mode === 'login' ? loginUser : registerUser;
  }, [mode, loginUser, registerUser]);
  
  const onSuccessCallback = useCallback(() => {
    onSuccess(mode);
  }, [mode, onSuccess]);
  
  // Стабильные обработчики для маскота - избегаем пересоздания
  const stableTriggerError = useCallback(triggerError, [triggerError]);
  const stableHandleInteraction = useCallback(handleInteraction, [handleInteraction]);
  const stableHandleAvatarClick = useCallback(handleAvatarClick, [handleAvatarClick]);
  
  // Хук формы с бизнес-логикой
  const { formData, fieldErrors, isSubmitting: formSubmitting, handleInputChange, handleSubmit } = useAuthForm({
    mode,
    onSubmit,
    onSuccess: onSuccessCallback,
    triggerError: stableTriggerError,
    handleInteraction: stableHandleInteraction
  });

  const actualIsSubmitting = isSubmitting || formSubmitting;

  return (
    <div className={`${styles.authModule} ${className || ''}`}>
      {/* Левая панель - брендинг */}
      <AuthBranding />

      {/* Правая панель - форма */}
      <div className={styles.formPanel}>
        <div className={`${styles.authContainer} ${mode === 'register' ? styles.register : ''}`}>
          
          {/* Маскот */}
          <AuthMascot
            mode={mode}
            message={mascotMessage}
            onAvatarClick={stableHandleAvatarClick}
            hasErrors={!!fieldErrors.email || !!fieldErrors.password}
          />

          {/* Заголовок */}
          <div className={mode === 'register' ? styles.header : ''}>
            <h1 className={`${styles.title} ${mode === 'register' ? styles.register : ''}`}>
              {mode === 'login' ? 'LoveMemory' : 'Анкета участника'}
            </h1>
            <p className={`${styles.subtitle} ${mode === 'register' ? styles.register : ''}`}>
              {mode === 'login' ? 'Войдите, чтобы продолжить' : 'Заполните данные для поиска пары'}
            </p>
          </div>

          {/* Форма */}
          <AuthFormComponent
            mode={mode}
            formData={formData}
            fieldErrors={fieldErrors}
            isSubmitting={actualIsSubmitting}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
          />

          {/* Divider */}
          <div className={`${styles.divider} ${mode === 'register' ? styles.register : ''}`}>
            <span>ИЛИ</span>
          </div>

          {/* Google кнопка */}
          <button 
            className={styles.googleButton} 
            type="button" 
            onClick={onGoogleSignIn} 
            disabled={actualIsSubmitting}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
              <path d="M16.51 8.25H9.03v3.44h4.15c-.16 1.12-1.29 2.5-4.15 2.5-2.49 0-4.5-2.02-4.5-4.5s2.01-4.5 4.5-4.5c1.23 0 2.22.45 2.97 1.15l2.76-2.76C14.01 1.25 11.66 0 9.03 0 4.05 0 0 4.05 0 9s4.05 9 9.03 9c5.04 0 8.78-3.67 8.78-8.75 0-.62-.07-1.22-.19-1.8z" fill="#FFF" />
            </svg>
            <span>Войти с помощью Google</span>
          </button>

          {/* Переключатель режима */}
          <p className={styles.linkText}>
            {mode === 'login' ? (
              <>Нет аккаунта? <button type="button" className={styles.switchButton} onClick={() => onModeSwitch('register')}>Создать</button></>
            ) : (
              <>Уже есть аккаунт? <button type="button" className={styles.switchButton} onClick={() => onModeSwitch('login')}>Войти</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
