import api from './api';

const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  if (response.data && response.data.token && response.data.user && response.data.user.id) {
    localStorage.setItem('auth', JSON.stringify(response.data));
  } else {
    throw new Error('Ответ сервера не содержит необходимых данных пользователя.');
  }
  return response.data;
};

const register = async (email, password, firstName) => {
  return await api.post('/auth/register', {
    email,
    password,
    first_name: firstName,
  });
};

const logout = () => {
  localStorage.removeItem('auth');
};

const authService = {
  register,
  login,
  logout,
};

export default authService;