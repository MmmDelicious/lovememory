/**
 * Authentication service for auth module
 */
import { apiClient } from '@shared/services'
import { API_ENDPOINTS } from '@shared/constants'
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types'

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      `${API_ENDPOINTS.AUTH}/login`,
      credentials
    )
    return response
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      `${API_ENDPOINTS.AUTH}/register`,
      userData
    )
    return response
  }

  /**
   * Get current user info
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>(`${API_ENDPOINTS.AUTH}/me`)
    return response
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await apiClient.post(`${API_ENDPOINTS.AUTH}/logout`)
    apiClient.clearAuthToken()
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${API_ENDPOINTS.AUTH}/refresh`)
    return response
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `${API_ENDPOINTS.AUTH}/forgot-password`,
      { email }
    )
    return response
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `${API_ENDPOINTS.AUTH}/reset-password`,
      { token, password }
    )
    return response
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `${API_ENDPOINTS.AUTH}/verify-email`,
      { token }
    )
    return response
  }
}

export const authService = new AuthService()
export default authService
