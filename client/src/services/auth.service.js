import api, { clearAuthToken } from './api';

const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  // Логика setAuthToken удалена, так как токен теперь в httpOnly cookie
  return response.data;
};

const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  // Логика setAuthToken удалена
  return response.data;
};

const logout = async () => {
  try {
    // Отправляем запрос на сервер для очистки httpOnly cookie
    await api.post('/auth/logout');
  } catch (error) {
    console.warn("Logout failed on server, clearing client session anyway.", error);
  } finally {
    // Очищаем только localStorage (httpOnly cookie очистится через сервер)
    clearAuthToken();
  }
};

// Проверка текущего пользователя
const getMe = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    clearAuthToken();
    throw error;
  }
};

// Обновление токена
const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh');
    // Логика setAuthToken удалена, так как новый токен также будет в cookie
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
