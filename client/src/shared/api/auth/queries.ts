/**
 * Authentication API queries and mutations
 */
import { apiClient } from '../client'
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ApiMessage
} from './types'

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  REFRESH: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
} as const

export class AuthAPI {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.LOGIN, credentials)
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.REGISTER, userData)
  }

  /**
   * Get current user info
   */
  async getMe(): Promise<User> {
    return apiClient.get<User>(AUTH_ENDPOINTS.ME)
  }

  /**
   * Logout user (clears httpOnly cookies)
   */
  async logout(): Promise<void> {
    await apiClient.post<void>(AUTH_ENDPOINTS.LOGOUT)
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(AUTH_ENDPOINTS.REFRESH)
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiMessage> {
    return apiClient.post<ApiMessage>(AUTH_ENDPOINTS.FORGOT_PASSWORD, data)
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiMessage> {
    return apiClient.post<ApiMessage>(AUTH_ENDPOINTS.RESET_PASSWORD, data)
  }

  /**
   * Verify email address
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<ApiMessage> {
    return apiClient.post<ApiMessage>(AUTH_ENDPOINTS.VERIFY_EMAIL, data)
  }
}

// Singleton instance
export const authAPI = new AuthAPI()
export default authAPI
