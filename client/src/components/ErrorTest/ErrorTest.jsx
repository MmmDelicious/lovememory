import React from 'react';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import api from '../../services/api';
import styles from './ErrorTest.module.css';

const ErrorTest = () => {
  const { handleError } = useErrorHandler();

  const testJavaScriptError = () => {
    // Имитируем JavaScript ошибку
    throw new Error('Тестовая JavaScript ошибка');
  };

  const testPromiseRejection = () => {
    // Имитируем отклонение промиса
    Promise.reject(new Error('Тестовое отклонение промиса'));
  };

  const testAPIError = async () => {
    try {
      // Запрос к несуществующему эндпоинту
      await api.get('/non-existent-endpoint');
    } catch (error) {
      handleError(error, 'Тестовая API ошибка');
    }
  };

  const testServerError = async () => {
    try {
      // Запрос, который может вызвать ошибку сервера
      await api.get('/test-server-error');
    } catch (error) {
      handleError(error, 'Тестовая ошибка сервера');
    }
  };

  const testNetworkError = async () => {
    try {
      // Запрос к несуществующему серверу
      await api.get('http://non-existent-server.com/api/test');
    } catch (error) {
      handleError(error, 'Тестовая сетевая ошибка');
    }
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
        <button onClick={testAPIError} className={styles.testButton}>
          API ошибка (404)
        </button>
        <button onClick={testServerError} className={styles.testButton}>
          Ошибка сервера (500)
        </button>
        <button onClick={testNetworkError} className={styles.testButton}>
          Сетевая ошибка
        </button>
      </div>
      <p className={styles.note}>
        ⚠️ Внимание: Эти кнопки вызывают реальные ошибки для тестирования системы!
      </p>
    </div>
  );
};

export default ErrorTest; 