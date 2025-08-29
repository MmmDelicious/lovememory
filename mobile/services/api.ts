import axios from 'axios';
import { API_BASE_URL } from './config';
import { getItem } from '../utils/storage';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use(async (config) => {
  try {
    const raw = await getItem('auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${parsed.token}`;
      }
    }
  } catch {}
  return config;
});

export type ApiResponse<T> = {
  data: T;
};

