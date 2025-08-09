import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  showError, 
  showNetworkError, 
  showServerError, 
  showNotFoundError, 
  showAuthError, 
  showPermissionError 
} from '../../utils/errorHandler';
import styles from './ErrorTest.module.css';

const ErrorTest = () => {
  const navigate = useNavigate();

  const testJavaScriptError = () => {
    // Имитируем JavaScript ошибку
    throw new Error('Тестовая JavaScript ошибка');
  };

  const testPromiseRejection = () => {
    // Имитируем отклонение промиса
    Promise.reject(new Error('Тестовое отклонение промиса'));
  };

  const testCustomError = () => {
    showError(418, 'Я чайник', {
      message: 'Это тестовая ошибка с кастомным кодом',
      type: 'Test Error',
      timestamp: new Date().toISOString()
    });
  };

  const testNetworkError = () => {
    showNetworkError();
  };

  const testServerError = () => {
    showServerError({
      message: 'Тестовая ошибка сервера',
      type: 'Test Server Error',
      details: 'Это симуляция ошибки сервера'
    });
  };

  const testNotFoundError = () => {
    showNotFoundError('Тестовый ресурс');
  };

  const testAuthError = () => {
    showAuthError();
  };

  const testPermissionError = () => {
    showPermissionError();
  };

  return (
    <div className={styles.container}>
      <h2>Тестирование системы обработки ошибок</h2>
      <div className={styles.buttonGrid}>
        <button onClick={testJavaScriptError} className={styles.testButton}>
          JavaScript ошибка
        </button>
        <button onClick={testPromiseRejection} className={styles.testButton}>
          Отклонение промиса
        </button>
        <button onClick={testCustomError} className={styles.testButton}>
          Кастомная ошибка (418)
        </button>
        <button onClick={testNetworkError} className={styles.testButton}>
          Ошибка сети
        </button>
        <button onClick={testServerError} className={styles.testButton}>
          Ошибка сервера (500)
        </button>
        <button onClick={testNotFoundError} className={styles.testButton}>
          Не найдено (404)
        </button>
        <button onClick={testAuthError} className={styles.testButton}>
          Ошибка авторизации (401)
        </button>
        <button onClick={testPermissionError} className={styles.testButton}>
          Ошибка доступа (403)
        </button>
      </div>
      <p className={styles.note}>
        ⚠️ Внимание: Эти кнопки вызывают реальные ошибки для тестирования системы!
      </p>
      <div className={styles.actions}>
        <button onClick={() => navigate('/dashboard')} className={styles.backButton}>
          Вернуться на главную
        </button>
        <button onClick={() => navigate('/error-demo')} className={styles.demoButton}>
          🎯 Демо-страница
        </button>
      </div>
    </div>
  );
};

export default ErrorTest; 