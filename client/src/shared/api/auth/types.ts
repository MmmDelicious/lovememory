/**
 * Authentication domain types
 */

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  gender?: 'male' | 'female'
  dateOfBirth?: string
  location?: string
  avatar?: string
  interests?: string[]
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  gender?: 'male' | 'female'
  dateOfBirth?: string
}

export interface AuthResponse {
  user: User
  message?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ApiMessage {
  message: string
}
