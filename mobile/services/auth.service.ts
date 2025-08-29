import { api } from './api';
import { getItem, setItem, removeItem } from '../utils/storage';

type LoginDto = { email: string; password: string };
type RegisterDto = { email: string; password: string; first_name?: string };

type User = {
  id: number;
  email: string;
  first_name?: string;
  gender?: string;
  avatarUrl?: string | null;
  coins?: number;
};

type AuthResponse = { token: string; user: User };

async function persistAuth(auth: AuthResponse) {
  await setItem('auth', JSON.stringify(auth));
}

export async function login(dto: LoginDto): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login', dto);
  await persistAuth(res.data);
  return res.data;
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', dto);
  await persistAuth(res.data);
  return res.data;
}

export async function logout() {
  await removeItem('auth');
}

export async function getToken(): Promise<string | null> {
  try {
    const raw = await getItem('auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

