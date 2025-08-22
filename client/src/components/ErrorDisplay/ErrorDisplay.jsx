import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import Worker404 from '../../assets/Worker404.json';
import Worker500 from '../../assets/Worker500.json';
import styles from './ErrorDisplay.module.css';
const ErrorDisplay = ({ 
  errorCode = 404, 
  errorMessage = 'Страница не найдена',
  errorDetails = null,
  onRetry = null,
  onGoHome = null 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [animationData, setAnimationData] = useState(Worker404);
  useEffect(() => {
    if (errorCode >= 500) {
      setAnimationData(Worker500);
    } else {
      setAnimationData(Worker404);
    }
  }, [errorCode]);
  const getErrorTitle = () => {
    switch (errorCode) {
      case 404:
        return 'Страница не найдена';
      case 403:
        return 'Доступ запрещен';
      case 401:
        return 'Не авторизован';
      case 500:
        return 'Внутренняя ошибка сервера';
      case 502:
        return 'Ошибка шлюза';
      case 503:
        return 'Сервис недоступен';
      case 0:
        return 'Нет подключения к интернету';
      default:
        return 'Произошла ошибка';
    }
  };
  const getErrorDescription = () => {
    switch (errorCode) {
      case 404:
        return 'Запрашиваемая страница не существует или была перемещена.';
      case 403:
        return 'У вас нет прав для доступа к этому ресурсу.';
      case 401:
        return 'Необходима авторизация для доступа к этому ресурсу.';
      case 500:
        return 'На сервере произошла внутренняя ошибка. Попробуйте позже.';
      case 502:
        return 'Сервер временно недоступен. Попробуйте позже.';
      case 503:
        return 'Сервис временно недоступен. Попробуйте позже.';
      case 0:
        return 'Проверьте подключение к интернету и попробуйте снова.';
      default:
        return 'Произошла непредвиденная ошибка. Попробуйте позже.';
    }
  };
  const getComfortingMessage = () => {
    const messages = [
      "Не волнуйтесь, это временно! 🔧",
      "Мы уже работаем над решением! ⚡",
      "Такое случается, но мы справимся! 💪",
      "Не переживайте, скоро всё заработает! ✨",
      "Мы на вашей стороне! 🛠️",
      "Это просто небольшая техническая заминка! 😊",
      "Наши специалисты уже в курсе! 🚀",
      "Скоро всё будет как прежде! 🌟"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        {}
        <div className={styles.animationContainer}>
          <Lottie 
            animationData={animationData} 
            loop={true}
            className={styles.lottieAnimation}
          />
        </div>
        {}
        <div className={styles.errorInfo}>
          <h1 className={styles.errorCode}>{errorCode}</h1>
          <h2 className={styles.errorTitle}>{getErrorTitle()}</h2>
          <p className={styles.errorDescription}>{getErrorDescription()}</p>
          {errorMessage && errorMessage !== getErrorTitle() && (
            <p className={styles.errorMessage}>{errorMessage}</p>
          )}
          {}
          <div className={styles.comfortingMessage}>
            <p>{getComfortingMessage()}</p>
          </div>
        </div>
        {}
        {errorDetails && (
          <div className={styles.errorDetails}>
            <button 
              className={styles.toggleDetails}
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Скрыть детали' : 'Показать детали ошибки'}
            </button>
            {showDetails && (
              <div className={styles.detailsContent}>
                <pre className={styles.errorStack}>
                  {typeof errorDetails === 'string' 
                    ? errorDetails 
                    : JSON.stringify(errorDetails, null, 2)
                  }
                </pre>
              </div>
            )}
          </div>
        )}
        {}
        <div className={styles.actionButtons}>
          {onRetry && (
            <button className={styles.retryButton} onClick={onRetry}>
              Попробовать снова
            </button>
          )}
          {onGoHome && (
            <button className={styles.homeButton} onClick={onGoHome}>
              Перейти домой
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ErrorDisplay; 
