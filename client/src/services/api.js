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

export default api;