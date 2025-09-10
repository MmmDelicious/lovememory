import api from '../../../services/api';
const getProfile = () => {
  return api.get('/user/profile');
};
const updateProfile = (profileData) => {
  return api.put('/user/profile', profileData);
};
const getProfileStats = () => {
  return api.get('/user/stats');
};
const uploadAvatar = (formData) => {
  return api.post('/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
const userService = {
  getProfile,
  updateProfile,
  getProfileStats,
  uploadAvatar,
};
export default userService;
