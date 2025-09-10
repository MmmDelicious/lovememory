import api, { clearAuthToken } from './api';

const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  return response.data;
};

const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  // Логика setAuthToken удалена
  return response.data;
};

const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
  } finally {
    clearAuthToken();
  }
};

const getMe = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    clearAuthToken();
    throw error;
  }
};

const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh');
    return response.data;
  } catch (error) {
    clearAuthToken();
    throw error;
  }
};

const authService = {
  register,
  login,
  logout,
  getMe,
  refreshToken,
};

export default authService;
