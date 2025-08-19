import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Детальное логирование ошибки API
    console.group('🔥 API ERROR 🔥');
    console.error('Full Error Object:', error);
    console.error('Request Config:', error.config);
    console.error('Request URL:', error.config?.url);
    console.error('Request Method:', error.config?.method);
    console.error('Request Headers:', error.config?.headers);
    console.error('Request Data:', error.config?.data);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
      console.error('Response Data:', error.response.data);
      console.error('Response Status Text:', error.response.statusText);
    } else if (error.request) {
      console.error('No Response Received:', error.request);
    } else {
      console.error('Request Setup Error:', error.message);
    }
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();
    
    if (error.response?.status === 401) {
      localStorage.removeItem('auth');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      return Promise.reject(error);
    }
    
    if (error.response?.status >= 500) {
      setTimeout(() => {
        const errorInfo = encodeURIComponent(JSON.stringify({
          errorCode: error.response.status,
          errorMessage: 'Ошибка сервера. Попробуйте позже.'
        }));
        window.location.href = `/error?error=${errorInfo}`;
      }, 2000);
      return Promise.reject(error);
    }
    
    if (!error.response) {
      const errorInfo = encodeURIComponent(JSON.stringify({
        errorCode: 0,
        errorMessage: 'Проблемы с подключением к серверу'
      }));
      window.location.href = `/error?error=${errorInfo}`;
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default api;