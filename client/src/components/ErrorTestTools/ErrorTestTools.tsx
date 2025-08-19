import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHaptics } from '../../hooks/useHaptics';
import { 
  showError, 
  showNetworkError, 
  showServerError, 
  showNotFoundError, 
  showAuthError, 
  showPermissionError 
} from '../../utils/errorHandler';
import styles from './ErrorTestTools.module.css';

interface ErrorTestToolsProps {
  mode?: 'test' | 'demo';
  title?: string;
  showBackButton?: boolean;
}

const ErrorTestTools: React.FC<ErrorTestToolsProps> = ({ 
  mode = 'test', 
  title,
  showBackButton = true 
}) => {
  const navigate = useNavigate();
  const { ctaHaptic, errorHaptic } = useHaptics();

  const isDemo = mode === 'demo';
  const displayTitle = title || (isDemo ? 'Демонстрация обработки ошибок' : 'Тестирование ошибок');

  const handleError = (type: string) => {
    // Haptic feedback для всех действий с ошибками
    errorHaptic();
    
    const prefix = isDemo ? 'Демонстрационная' : 'Тестовая';
    
    switch (type) {
      case 'network':
        showNetworkError();
        break;
      case 'server':
        showServerError({
          message: `${prefix} ошибка сервера`,
          type: `${mode} Server Error`,
          details: isDemo ? 'Это пример ошибки сервера с деталями' : 'Это симуляция ошибки сервера'
        });
        break;
      case 'notfound':
        showNotFoundError(isDemo ? 'демонстрационный ресурс' : 'Тестовый ресурс');
        break;
      case 'auth':
        showAuthError();
        break;
      case 'permission':
        showPermissionError();
        break;
      case 'custom':
        showError(418, 'Я чайник!', {
          message: `Это ${prefix.toLowerCase()} кастомная ошибка`,
          type: `${mode} Custom Error`,
          timestamp: new Date().toISOString(),
          details: isDemo ? 'Демонстрация возможностей системы обработки ошибок' : undefined
        });
        break;
      case 'javascript':
        throw new Error(`${prefix} JavaScript ошибка`);
      case 'promise':
        Promise.reject(new Error(`${prefix} ошибка промиса`));
        break;
      default:
        break;
    }
  };

  const errorButtons = [
    { key: 'javascript', label: 'JavaScript ошибка', emoji: '⚡' },
    { key: 'promise', label: 'Отклонение промиса', emoji: '🔄' },
    { key: 'custom', label: 'Кастомная ошибка (418)', emoji: '🫖' },
    { key: 'network', label: 'Ошибка сети', emoji: '📡' },
    { key: 'server', label: 'Ошибка сервера (500)', emoji: '🔥' },
    { key: 'notfound', label: 'Не найдено (404)', emoji: '🔍' },
    { key: 'auth', label: 'Ошибка авторизации (401)', emoji: '🔒' },
    { key: 'permission', label: 'Ошибка доступа (403)', emoji: '⛔' }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{displayTitle}</h1>
        <p className={styles.subtitle}>
          {isDemo 
            ? 'Просмотр различных типов ошибок системы' 
            : 'Тестирование системы обработки ошибок'
          }
        </p>
      </div>

      <div className={styles.buttonGrid}>
        {errorButtons.map(({ key, label, emoji }) => (
          <button 
            key={key}
            onClick={() => handleError(key)} 
            className={`${styles.errorButton} ${styles[`${key}Button`]} pressable stagger-item`}
          >
            <span className={styles.emoji}>{emoji}</span>
            <span className={styles.label}>{label}</span>
          </button>
        ))}
      </div>

      <div className={styles.warning}>
        <p className={styles.warningText}>
          ⚠️ Внимание: Эти кнопки вызывают реальные ошибки для {isDemo ? 'демонстрации' : 'тестирования'} системы!
        </p>
      </div>

      {showBackButton && (
        <div className={styles.actions}>
          <button 
            onClick={() => {
              ctaHaptic();
              navigate('/dashboard');
            }} 
            className={`${styles.backButton} btn btn-secondary`}
          >
            ← Вернуться на главную
          </button>
          {!isDemo && (
            <button 
              onClick={() => {
                ctaHaptic();
                navigate('/error-demo');
              }} 
              className={`${styles.demoButton} btn btn-primary`}
            >
              🎯 Демо-страница
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorTestTools;
