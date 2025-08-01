import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
});

api.interceptors.request.use(
  (config) => {
    const storedData = localStorage.getItem('auth');
    if (storedData) {
      try {
        const userData = JSON.parse(storedData);
        if (userData && userData.token) {
          config.headers['Authorization'] = `Bearer ${userData.token}`;
        }
      } catch (e) {
        console.error("Could not parse auth data from localStorage", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Обработчик ответов для автоматической обработки ошибок
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Логируем ошибку
    console.error('API Error:', error);
    
    // Если ошибка 401 (неавторизован), перенаправляем на логин
    if (error.response?.status === 401) {
      localStorage.removeItem('auth');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Для критических ошибок сервера (5xx) перенаправляем на страницу ошибки
    if (error.response?.status >= 500) {
      const errorInfo = encodeURIComponent(JSON.stringify({
        errorCode: error.response.status,
        errorMessage: 'Ошибка сервера. Попробуйте позже.'
      }));
      window.location.href = `/error?error=${errorInfo}`;
      return Promise.reject(error);
    }
    
    // Для ошибок сети (нет ответа от сервера)
    if (!error.response) {
      const errorInfo = encodeURIComponent(JSON.stringify({
        errorCode: 0,
        errorMessage: 'Проблемы с подключением к серверу'
      }));
      window.location.href = `/error?error=${errorInfo}`;
      return Promise.reject(error);
    }
    
    // Для других ошибок возвращаем Promise.reject для обработки в компонентах
    return Promise.reject(error);
  }
);

export default api;