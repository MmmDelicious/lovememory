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
  window.addEventListener('error', (event) => {
    if (event.target && event.target.tagName) {
      console.error('Resource loading error:', event.target.src || event.target.href);
      if (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK') {
        const resourceError = new Error(`Failed to load resource: ${event.target.src || event.target.href}`);
        logError(resourceError, 'Resource loading');
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
      console.group('🚨 UNHANDLED ERROR 🚨');
      console.error('Error:', event.error);
      console.error('Message:', event.error?.message || 'Неизвестная ошибка');
      console.error('Stack:', event.error?.stack);
      console.error('File:', event.filename);
      console.error('Line:', event.lineno, 'Column:', event.colno);
      console.error('Timestamp:', new Date().toISOString());
      console.error('URL:', window.location.href);
      console.groupEnd();
      logError(event.error, 'Global error handler');
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
    event.preventDefault();
    logError(event.reason, 'Unhandled promise rejection');
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
  window.addEventListener('beforeunload', (event) => {
    console.log('Page is unloading');
  });
};
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
};
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
