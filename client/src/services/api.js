import axios from 'axios';

// Создаем базовый URL с fallback
// В режиме разработки используем прокси Vite, в продакшене - полный URL
const baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000, // 30 секунд таймаут
  headers: {
    'Content-Type': 'application/json',
  },
});

// Переменная для отслеживания активных запросов на обновление токена
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    // Не добавляем Authorization header - полагаемся на httpOnly cookies
    // которые автоматически отправляются через withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Поскольку токен теперь в httpOnly cookie, мы не можем его читать из JS
// Эти функции оставляем для совместимости, но они работают только с localStorage
const getAuthToken = () => {
  try {
    return localStorage.getItem('authToken');
  } catch (error) {
    console.warn('Failed to get auth token from localStorage:', error);
    return null;
  }
};

// Сохраняем токен в localStorage для совместимости (например для других API вызовов)
const setAuthToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  } catch (error) {
    console.warn('Failed to set auth token in localStorage:', error);
  }
};

// Функция для очистки токена - очищаем localStorage и просим сервер очистить cookie
const clearAuthToken = () => {
  try {
    localStorage.removeItem('authToken');
    // Не можем напрямую очистить httpOnly cookie - сервер должен это сделать
  } catch (error) {
    console.warn('Failed to clear auth token:', error);
  }
};
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Логирование ошибок только в dev режиме
    if (import.meta.env.DEV) {
      console.group('API ERROR');
      console.error('Request URL:', error.config?.url);
      console.error('Request Method:', error.config?.method);
      console.error('Response Status:', error.response?.status);
      console.error('Response Data:', error.response?.data);
      console.error('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }

    // Обработка 401 ошибок - сразу на логин (упрощенная версия)
    if (error.response?.status === 401) {
      clearAuthToken();
      
      // Перенаправляем на логин только если не уже на странице логина
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
      return Promise.reject(error);
    }

    // Обработка серверных ошибок (5xx)
    if (error.response?.status >= 500) {
      const errorInfo = encodeURIComponent(JSON.stringify({
        errorCode: error.response.status,
        errorMessage: 'Ошибка сервера. Попробуйте позже.'
      }));
      
      setTimeout(() => {
        if (!window.location.pathname.includes('/error')) {
          window.location.href = `/error?error=${errorInfo}`;
        }
      }, 2000);
      return Promise.reject(error);
    }

    // Обработка сетевых ошибок
    if (!error.response && error.code !== 'ERR_CANCELED') {
      const errorInfo = encodeURIComponent(JSON.stringify({
        errorCode: 0,
        errorMessage: 'Проблемы с подключением к серверу'
      }));
      
      if (!window.location.pathname.includes('/error')) {
        window.location.href = `/error?error=${errorInfo}`;
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Экспортируем API и утилиты для работы с токенами
export { getAuthToken, setAuthToken, clearAuthToken };
export default api;
