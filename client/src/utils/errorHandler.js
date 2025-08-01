// Глобальный обработчик ошибок
export const setupGlobalErrorHandler = () => {
  // Обработчик необработанных ошибок
  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    
    // Логируем ошибку
    logError(event.error, 'Global error handler');
    
    // Перенаправляем на страницу ошибки с информацией об ошибке
    const errorInfo = encodeURIComponent(JSON.stringify({
      errorCode: 500,
      errorMessage: 'Произошла непредвиденная ошибка в приложении'
    }));
    window.location.href = `/error?error=${errorInfo}`;
  });

  // Обработчик необработанных отклонений промисов
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Предотвращаем стандартную обработку
    event.preventDefault();
    
    // Логируем ошибку
    logError(event.reason, 'Unhandled promise rejection');
    
    // Перенаправляем на страницу ошибки
    const errorInfo = encodeURIComponent(JSON.stringify({
      errorCode: 500,
      errorMessage: 'Ошибка при выполнении операции'
    }));
    window.location.href = `/error?error=${errorInfo}`;
  });

  // Обработчик ошибок загрузки ресурсов
  window.addEventListener('error', (event) => {
    if (event.target && event.target.tagName) {
      console.error('Resource loading error:', event.target.src || event.target.href);
      // Для критических ресурсов можно показать ошибку
      if (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK') {
        logError(new Error(`Failed to load resource: ${event.target.src || event.target.href}`), 'Resource loading');
      }
    }
  }, true);

  // Обработчик ошибок сети
  window.addEventListener('offline', () => {
    console.error('Network is offline');
    const errorInfo = encodeURIComponent(JSON.stringify({
      errorCode: 0,
      errorMessage: 'Нет подключения к интернету'
    }));
    window.location.href = `/error?error=${errorInfo}`;
  });

  // Обработчик ошибок загрузки страницы
  window.addEventListener('beforeunload', (event) => {
    // Можно добавить логику для сохранения состояния
    console.log('Page is unloading');
  });
};

// Функция для логирования ошибок (можно расширить для отправки в сервис аналитики)
export const logError = (error, context = '') => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  console.error('Error logged:', errorInfo);
  
  // Здесь можно добавить отправку в сервис аналитики
  // sendToErrorService(errorInfo);
}; 