import { api } from './api';

export function getProfile() {
  return api.get('/user/profile');
}

export function updateProfile(profileData: any) {
  return api.put('/user/profile', profileData);
}

export function getProfileStats() {
  return api.get('/user/stats');
}

export function uploadAvatar(formData: FormData) {
  return api.post('/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function uploadAvatarFile(fileUri: string) {
  const formData = new FormData();
  // Simple RN web/native compatible file part
  // @ts-ignore
  formData.append('avatar', { uri: fileUri, name: 'avatar.jpg', type: 'image/jpeg' });
  return uploadAvatar(formData);
}


