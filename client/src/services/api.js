import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Токены теперь управляются через httpOnly cookies, эти функции больше не нужны
const getAuthToken = () => {
  // Токен недоступен в JavaScript - он в httpOnly cookie
  return null;
};

const setAuthToken = (token) => {
  // Токен устанавливается сервером в httpOnly cookie, ничего не делаем
  console.warn('setAuthToken deprecated: tokens are now managed via httpOnly cookies');
};

const clearAuthToken = () => {
  // Токен очищается при logout запросе на сервер, ничего не делаем
  console.warn('clearAuthToken deprecated: tokens are now managed via httpOnly cookies');
};
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (import.meta.env.DEV && 
        !(error.response?.status === 401 && error.config?.url?.includes('/auth/me')) &&
        !(!error.response && error.config?.url?.includes('/auth/me'))) {
      console.group('API ERROR');
      console.error('Request URL:', error.config?.url);
      console.error('Request Method:', error.config?.method);
      console.error('Response Status:', error.response?.status);
      console.error('Response Data:', error.response?.data);
      console.error('Timestamp:', new Date().toISOString());
      console.groupEnd();
    }

    if (error.response?.status === 401) {
      if (!error.config?.url?.includes('/auth/me')) {
        console.log('[API] Got 401 error, user not authenticated');
      }
      // httpOnly cookie будет автоматически обработан браузером
      return Promise.reject(error);
    }

    if (error.response?.status >= 500) {
      console.log('[API] Got 5xx error, but skipping redirect for debugging');
      return Promise.reject(error);
    }

    if (!error.response && error.code !== 'ERR_CANCELED') {
      if (!error.config?.url?.includes('/auth/me')) {
        console.log('[API] Network error - server may be down');
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Экспорты оставляем для обратной совместимости, но функции deprecated
export { getAuthToken, setAuthToken, clearAuthToken };
export default api;
