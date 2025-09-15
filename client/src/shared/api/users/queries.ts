/**
 * Users API queries and mutations
 */
import { apiClient } from '../client'
import type { UserProfile, Interest, UpdateProfileRequest } from './types'

const USERS_ENDPOINTS = {
  PROFILE: (id: string) => `/users/${id}`,
  UPDATE_PROFILE: (id: string) => `/users/${id}`,
  CURRENT_PROFILE: '/user/profile',
  CURRENT_PROFILE_UPDATE: '/user/profile', 
  STATS: '/user/stats',
  AVATAR: '/user/avatar',
  INTERESTS: '/interests',
  INTERESTS_CATEGORIES: '/interests/categories',
  INTERESTS_POPULAR: '/interests/popular',
  INTERESTS_COMMON: (userId: string, partnerId: string) => `/interests/common/${userId}/${partnerId}`,
  USER_INTERESTS: (id: string) => `/users/${id}/interests`,
  USER_INTERESTS_BATCH: (id: string) => `/interests/users/${id}/batch`,
  USER_INTEREST: (userId: string, interestId: string) => `/interests/users/${userId}/${interestId}`,
} as const

export class UsersAPI {
  /**
   * Get user profile
   */
  async getUserProfile(id: string): Promise<UserProfile> {
    return apiClient.get<UserProfile>(USERS_ENDPOINTS.PROFILE(id))
  }

  /**
   * Update user profile
   */
  async updateProfile(id: string, data: UpdateProfileRequest): Promise<UserProfile> {
    return apiClient.put<UserProfile>(USERS_ENDPOINTS.UPDATE_PROFILE(id), data)
  }

  /**
   * Get available interests
   */
  async getInterests(): Promise<Interest[]> {
    return apiClient.get<Interest[]>(USERS_ENDPOINTS.INTERESTS)
  }

  /**
   * Update user interests
   */
  async updateInterests(userId: string, interests: string[]): Promise<void> {
    return apiClient.put<void>(USERS_ENDPOINTS.USER_INTERESTS(userId), { interests })
  }

  /**
   * Get all available interests with caching
   */
  async getAllInterests(): Promise<Interest[]> {
    return apiClient.get<Interest[]>(USERS_ENDPOINTS.INTERESTS)
  }

  /**
   * Get interests grouped by categories
   */
  async getInterestsByCategory(): Promise<any> {
    return apiClient.get<any>(USERS_ENDPOINTS.INTERESTS_CATEGORIES)
  }

  /**
   * Get popular interests
   */
  async getPopularInterests(limit: number = 20): Promise<Interest[]> {
    return apiClient.get<Interest[]>(`${USERS_ENDPOINTS.INTERESTS_POPULAR}?limit=${limit}`)
  }

  /**
   * Get user interests with optional preference filter
   */
  async getUserInterests(userId: string, preference?: string): Promise<any[]> {
    const params = preference ? { preference } : undefined
    return apiClient.get<any[]>(`/interests/users/${userId}`, { params })
  }

  /**
   * Set multiple user interests at once
   */
  async setMultipleUserInterests(userId: string, interests: any[]): Promise<any[]> {
    return apiClient.post<any[]>(USERS_ENDPOINTS.USER_INTERESTS_BATCH(userId), { interests })
  }

  /**
   * Remove user interest
   */
  async removeUserInterest(userId: string, interestId: string): Promise<void> {
    return apiClient.delete<void>(USERS_ENDPOINTS.USER_INTEREST(userId, interestId))
  }

  /**
   * Get common interests between two users
   */
  async getCommonInterests(userId: string, partnerId: string): Promise<any[]> {
    return apiClient.get<any[]>(USERS_ENDPOINTS.INTERESTS_COMMON(userId, partnerId))
  }

  /**
   * Get current user profile (for legacy compatibility)
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>(USERS_ENDPOINTS.CURRENT_PROFILE)
  }

  /**
   * Update current user profile (for legacy compatibility)
   */
  async updateCurrentProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient.put<UserProfile>(USERS_ENDPOINTS.CURRENT_PROFILE_UPDATE, profileData)
  }

  /**
   * Get user profile stats
   */
  async getProfileStats(): Promise<any> {
    return apiClient.get<any>(USERS_ENDPOINTS.STATS)
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<any> {
    return apiClient.uploadFile<any>(USERS_ENDPOINTS.AVATAR, file)
  }
}

export const usersAPI = new UsersAPI()
export default usersAPI
