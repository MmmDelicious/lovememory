/**
 * @fileoverview TypeScript типы для аутентификации
 */

export interface User {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    bio?: string;
    avatarUrl?: string;
    gender?: 'male' | 'female' | 'other';
    age?: number;
    city?: string;
    role: 'user' | 'admin';
    coins: number;
    telegram_chat_id?: string;
  }
  
  export interface AuthData {
    user: User;
    token: string;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    gender?: 'male' | 'female' | 'other';
    age?: number;
    city?: string;
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface AuthContextType {
    user: User | null;
    partner: unknown | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<AuthData>;
    logout: () => Promise<void>;
    register: (userData: RegisterRequest) => Promise<AuthData>;
    updateUser: (user: User) => void;
  }