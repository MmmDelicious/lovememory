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
      errorMessage: 'Произошла непредвиденная ошибка в приложении',
      errorDetails: {
        message: event.error?.message || 'Неизвестная ошибка',
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
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
      errorMessage: 'Ошибка при выполнении операции',
      errorDetails: {
        message: event.reason?.message || 'Ошибка промиса',
        stack: event.reason?.stack,
        type: 'Promise Rejection'
      }
    }));
    window.location.href = `/error?error=${errorInfo}`;
  });

  // Обработчик ошибок загрузки ресурсов
  window.addEventListener('error', (event) => {
    if (event.target && event.target.tagName) {
      console.error('Resource loading error:', event.target.src || event.target.href);
      // Для критических ресурсов можно показать ошибку
      if (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK') {
        const resourceError = new Error(`Failed to load resource: ${event.target.src || event.target.href}`);
        logError(resourceError, 'Resource loading');
        
        // Показываем ошибку только для критических ресурсов
        if (event.target.tagName === 'SCRIPT') {
          const errorInfo = encodeURIComponent(JSON.stringify({
            errorCode: 500,
            errorMessage: 'Ошибка загрузки ресурса',
            errorDetails: {
              message: resourceError.message,
              resource: event.target.src || event.target.href,
              type: 'Resource Loading Error'
            }
          }));
          window.location.href = `/error?error=${errorInfo}`;
        }
      }
    }
  }, true);

  // Обработчик ошибок сети
  window.addEventListener('offline', () => {
    console.error('Network is offline');
    const errorInfo = encodeURIComponent(JSON.stringify({
      errorCode: 0,
      errorMessage: 'Нет подключения к интернету',
      errorDetails: {
        message: 'Проверьте подключение к интернету',
        type: 'Network Error',
        timestamp: new Date().toISOString()
      }
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

// Утилиты для вызова ошибок из компонентов
export const showError = (errorCode, errorMessage, errorDetails = null) => {
  const errorInfo = encodeURIComponent(JSON.stringify({
    errorCode,
    errorMessage,
    errorDetails
  }));
  window.location.href = `/error?error=${errorInfo}`;
};

export const showNetworkError = () => {
  showError(0, 'Нет подключения к интернету', {
    message: 'Проверьте подключение к интернету и попробуйте снова',
    type: 'Network Error',
    timestamp: new Date().toISOString()
  });
};

export const showServerError = (details = null) => {
  showError(500, 'Ошибка сервера', details);
};

export const showNotFoundError = (resource = 'Страница') => {
  showError(404, `${resource} не найдена`, {
    message: `Запрашиваемый ресурс не существует`,
    type: 'Not Found',
    resource
  });
};

export const showAuthError = () => {
  showError(401, 'Необходима авторизация', {
    message: 'Для доступа к этому ресурсу необходимо войти в систему',
    type: 'Authentication Required'
  });
};

export const showPermissionError = () => {
  showError(403, 'Доступ запрещен', {
    message: 'У вас нет прав для доступа к этому ресурсу',
    type: 'Permission Denied'
  });
}; 