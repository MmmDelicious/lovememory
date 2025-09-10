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

const getAuthToken = () => {
  try {
    return localStorage.getItem('authToken');
  } catch (error) {
    console.warn('Failed to get auth token from localStorage:', error);
    return null;
  }
};

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

const clearAuthToken = () => {
  try {
    localStorage.removeItem('authToken');
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
        console.log('🟡 API: Got 401 error, user not authenticated');
      }
      clearAuthToken();
      return Promise.reject(error);
    }

    if (error.response?.status >= 500) {
      console.log('🟡 API: Got 5xx error, but skipping redirect for debugging');
      return Promise.reject(error);
    }

    if (!error.response && error.code !== 'ERR_CANCELED') {
      if (!error.config?.url?.includes('/auth/me')) {
        console.log('🟡 API: Network error - server may be down');
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export { getAuthToken, setAuthToken, clearAuthToken };
export default api;
