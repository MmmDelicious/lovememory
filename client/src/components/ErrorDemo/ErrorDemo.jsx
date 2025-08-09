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
import styles from './ErrorDemo.module.css';

const ErrorDemo = () => {
  const navigate = useNavigate();

  const handleError = (type) => {
    switch (type) {
      case 'network':
        showNetworkError();
        break;
      case 'server':
        showServerError({
          message: 'Демонстрационная ошибка сервера',
          type: 'Demo Server Error',
          details: 'Это пример ошибки сервера с деталями'
        });
        break;
      case 'notfound':
        showNotFoundError('демонстрационный ресурс');
        break;
      case 'auth':
        showAuthError();
        break;
      case 'permission':
        showPermissionError();
        break;
      case 'custom':
        showError(418, 'Я чайник!', {
          message: 'Это демонстрационная кастомная ошибка',
          type: 'Demo Custom Error',
          timestamp: new Date().toISOString(),
          details: 'Демонстрация возможностей системы обработки ошибок'
        });
        break;
      case 'javascript':
        throw new Error('Демонстрационная JavaScript ошибка');
      case 'promise':
        Promise.reject(new Error('Демонстрационная ошибка промиса'));
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎯 Демонстрация системы обработки ошибок</h1>
        <p>Выберите тип ошибки для демонстрации новой системы</p>
      </div>

      <div className={styles.errorGrid}>
        <div className={styles.errorCard}>
          <h3>🌐 Сетевая ошибка</h3>
          <p>Симуляция отсутствия интернет-соединения</p>
          <button onClick={() => handleError('network')} className={styles.demoButton}>
            Показать
          </button>
        </div>

        <div className={styles.errorCard}>
          <h3>⚡ Ошибка сервера</h3>
          <p>Симуляция внутренней ошибки сервера</p>
          <button onClick={() => handleError('server')} className={styles.demoButton}>
            Показать
          </button>
        </div>

        <div className={styles.errorCard}>
          <h3>🔍 Не найдено</h3>
          <p>Симуляция ошибки 404</p>
          <button onClick={() => handleError('notfound')} className={styles.demoButton}>
            Показать
          </button>
        </div>

        <div className={styles.errorCard}>
          <h3>🔐 Ошибка авторизации</h3>
          <p>Симуляция ошибки 401</p>
          <button onClick={() => handleError('auth')} className={styles.demoButton}>
            Показать
          </button>
        </div>

        <div className={styles.errorCard}>
          <h3>🚫 Ошибка доступа</h3>
          <p>Симуляция ошибки 403</p>
          <button onClick={() => handleError('permission')} className={styles.demoButton}>
            Показать
          </button>
        </div>

        <div className={styles.errorCard}>
          <h3>🎨 Кастомная ошибка</h3>
          <p>Демонстрация кастомного кода ошибки</p>
          <button onClick={() => handleError('custom')} className={styles.demoButton}>
            Показать
          </button>
        </div>

        <div className={styles.errorCard}>
          <h3>💥 JavaScript ошибка</h3>
          <p>Симуляция необработанной JS ошибки</p>
          <button onClick={() => handleError('javascript')} className={styles.demoButton}>
            Показать
          </button>
        </div>

        <div className={styles.errorCard}>
          <h3>⏳ Ошибка промиса</h3>
          <p>Симуляция отклонения промиса</p>
          <button onClick={() => handleError('promise')} className={styles.demoButton}>
            Показать
          </button>
        </div>
      </div>

      <div className={styles.features}>
        <h2>✨ Возможности новой системы:</h2>
        <ul>
          <li>🎭 Красивые Lottie анимации для разных типов ошибок</li>
          <li>📊 Детальная информация об ошибках</li>
          <li>🔄 Возможность повторить действие</li>
          <li>🏠 Быстрый переход на главную</li>
          <li>📱 Адаптивный дизайн</li>
          <li>🌙 Поддержка темной темы</li>
          <li>⚡ Автоматическое логирование ошибок</li>
        </ul>
      </div>

      <div className={styles.actions}>
        <button onClick={() => navigate('/dashboard')} className={styles.backButton}>
          ← Вернуться на главную
        </button>
        <button onClick={() => navigate('/error-test')} className={styles.testButton}>
          🧪 Тестовая страница
        </button>
      </div>
    </div>
  );
};

export default ErrorDemo; 