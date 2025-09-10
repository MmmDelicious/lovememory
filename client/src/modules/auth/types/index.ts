// Auth types
export interface User {
  id: string
  email: string
  username?: string
  avatar?: string
  isEmailVerified?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword: string
  username?: string
}

export interface AuthResponse {
  user: User
  message?: string
}
