import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ErrorPage.module.css';

const ErrorPage = ({ errorCode = 404, errorMessage = 'Страница не найдена' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorInfo, setErrorInfo] = useState({ errorCode, errorMessage });
  
  useEffect(() => {
    // Получаем параметры ошибки из состояния навигации
    const state = location.state;
    if (state?.errorCode || state?.errorMessage) {
      setErrorInfo({
        errorCode: state.errorCode || errorCode,
        errorMessage: state.errorMessage || errorMessage
      });
      return;
    }
    
    // Получаем параметры ошибки из URL (для глобальных обработчиков)
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      try {
        const parsedError = JSON.parse(decodeURIComponent(errorParam));
        setErrorInfo({
          errorCode: parsedError.errorCode || errorCode,
          errorMessage: parsedError.errorMessage || errorMessage
        });
      } catch (e) {
        console.error('Failed to parse error from URL:', e);
        setErrorInfo({ errorCode, errorMessage });
      }
    }
  }, [location, errorCode, errorMessage]);

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        {/* Иконка с инструментами */}
        <div className={styles.errorIcon}>
          <div className={styles.toolsIcon}>
            <div className={styles.wrench}></div>
            <div className={styles.screwdriver}></div>
          </div>
        </div>
        
        {/* Текст ошибки */}
        <h1 className={styles.errorCode}>Ошибка {errorInfo.errorCode}</h1>
        <p className={styles.errorMessage}>{errorInfo.errorMessage}</p>
        
        {/* Кнопка "Перейти домой" */}
        <button className={styles.homeButton} onClick={handleGoHome}>
          Перейти домой
        </button>
      </div>
    </div>
  );
};

export default ErrorPage; 