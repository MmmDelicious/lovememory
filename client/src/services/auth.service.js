import api from './api';

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
    // Сервер очистит httpOnly cookie, дополнительных действий не нужно
  } catch (error) {
    // Даже если сервер недоступен, cookie должен быть очищен
    console.warn('Logout request failed, but proceeding with client logout:', error);
  }
};

const getMe = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    // httpOnly cookie будет обработан автоматически при 401 ошибке
    throw error;
  }
};

const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh');
    return response.data;
  } catch (error) {
    // httpOnly cookie будет обработан автоматически при ошибке
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
