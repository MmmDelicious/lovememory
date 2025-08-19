// Глобальный обработчик ошибок

interface ErrorDetails {
  message?: string;
  stack?: string;
  type?: string;
  timestamp?: string;
  details?: string;
  resource?: string;
  [key: string]: any;
}
export const setupGlobalErrorHandler = () => {
  // Обработчик необработанных ошибок и ошибок загрузки ресурсов
  window.addEventListener('error', (event) => {
    // Проверяем, это ошибка загрузки ресурса или JavaScript ошибка
    if (event.target && event.target.tagName) {
      // Ошибка загрузки ресурса
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
    } else {
      // JavaScript ошибка
      console.group('🚨 UNHANDLED ERROR 🚨');
      console.error('Error:', event.error);
      console.error('Message:', event.error?.message || 'Неизвестная ошибка');
      console.error('Stack:', event.error?.stack);
      console.error('File:', event.filename);
      console.error('Line:', event.lineno, 'Column:', event.colno);
      console.error('Timestamp:', new Date().toISOString());
      console.error('URL:', window.location.href);
      console.groupEnd();
      
      // Логируем ошибку
      logError(event.error, 'Global error handler');
      
      // Задержка перед перенаправлением, чтобы консоль успела показать ошибку
      setTimeout(() => {
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
      }, 2000); // 2 секунды задержки
    }
  }, true);

  // Обработчик необработанных отклонений промисов
  window.addEventListener('unhandledrejection', (event) => {
    console.group('🚨 UNHANDLED PROMISE REJECTION 🚨');
    console.error('Reason:', event.reason);
    console.error('Message:', event.reason?.message || 'Ошибка промиса');
    console.error('Stack:', event.reason?.stack);
    console.error('Type:', typeof event.reason);
    console.error('Timestamp:', new Date().toISOString());
    console.error('URL:', window.location.href);
    if (event.reason?.response) {
      console.error('HTTP Response:', event.reason.response);
      console.error('Status:', event.reason.response?.status);
      console.error('Data:', event.reason.response?.data);
    }
    console.groupEnd();
    
    // Предотвращаем стандартную обработку
    event.preventDefault();
    
    // Логируем ошибку
    logError(event.reason, 'Unhandled promise rejection');
    
    // Задержка перед перенаправлением
    setTimeout(() => {
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
    }, 2000);
  });

  // Обработчик ошибок загрузки ресурсов - объединен с основным обработчиком
  // Убрано дублирование addEventListener('error')

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
export const logError = (error: any, context: string = '') => {
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
export const showError = (errorCode: number, errorMessage: string, errorDetails: ErrorDetails | null = null) => {
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

export const showServerError = (details: ErrorDetails | null = null) => {
  showError(500, 'Ошибка сервера', details);
};

export const showNotFoundError = (resource: string = 'Страница') => {
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