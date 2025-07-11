import api from './api';

const getProfile = () => {
  return api.get('/user/profile');
};

const updateProfile = (profileData) => {
  return api.put('/user/profile', profileData);
};

const userService = {
  getProfile,
  updateProfile,
};

export default userService;