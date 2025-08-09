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
  return response.data;
};

const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error("Logout failed on server, clearing client session anyway.", error);
  }
};

const authService = {
  register,
  login,
  logout,
};

export default authService;