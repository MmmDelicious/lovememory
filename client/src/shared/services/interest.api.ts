import { apiClient } from './api';

// Типы для интересов
export interface Interest {
  id: string;
  name: string;
  category: string;
  description: string;
  emoji: string;
  is_active: boolean;
  popularity_score: number;
}

export interface UserInterest {
  user_id: string;
  interest_id: string;
  preference: 'love' | 'like' | 'neutral' | 'dislike';
  intensity: number;
  metadata: Record<string, any>;
  added_at: string;
  Interest?: Interest;
}

export interface InterestRecommendation {
  interest_id: string;
  predicted_rating: number;
  recommendation_type: string;
  Interest?: Interest;
}

export interface UserCompatibility {
  user1_id: string;
  user2_id: string;
  compatibility_score: number;
  compatibility_percentage: number;
  model_versions: {
    user1: string;
    user2: string;
  };
  calculated_at: string;
}

export interface InterestAnalytics {
  stats: Array<{
    user_id: string;
    interest_id: string;
    current_rating: number;
    total_interactions: number;
    rating_count: number;
    last_interaction: string;
    avg_rating: number;
  }>;
  activity: Array<{
    date: string;
    total_events: number;
    unique_interests: number;
    sessions_count: number;
  }>;
  recent_history: Array<{
    user_id: string;
    interest_id: string;
    event_type: string;
    old_rating?: number;
    new_rating?: number;
    timestamp: string;
    source: string;
    metadata: string;
  }>;
}

export interface TopInterest {
  interest_id: string;
  total_interactions: number;
  unique_users: number;
  overall_rating: number;
  id?: string;
  name?: string;
  category?: string;
  description?: string;
  emoji?: string;
}

/**
 * API сервис для работы с интересами
 */
class InterestApiService {
  
  /**
   * Получить все доступные интересы
   */
  async getAllInterests(params?: {
    category?: string;
    search?: string;
    limit?: number;
  }): Promise<Interest[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `/interests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<Interest[]>(url);
  }

  /**
   * Получить интересы по категориям
   */
  async getInterestsByCategory(): Promise<Record<string, Interest[]>> {
    return apiClient.get<Record<string, Interest[]>>('/interests/categories');
  }

  /**
   * Получить популярные интересы
   */
  async getPopularInterests(limit = 20): Promise<Interest[]> {
    return apiClient.get<Interest[]>(`/interests/popular?limit=${limit}`);
  }

  /**
   * Получить интересы пользователя
   */
  async getUserInterests(
    userId: string, 
    params?: {
      preference?: 'love' | 'like' | 'neutral' | 'dislike';
      source?: 'postgresql' | 'clickhouse';
    }
  ): Promise<UserInterest[]> {
    const queryParams = new URLSearchParams();
    if (params?.preference) queryParams.append('preference', params.preference);
    if (params?.source) queryParams.append('source', params.source);
    
    const url = `/interests/users/${userId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<UserInterest[]>(url);
  }

  /**
   * Добавить/обновить интерес пользователя
   */
  async setUserInterest(userId: string, data: {
    interest_id: string;
    preference: 'love' | 'like' | 'neutral' | 'dislike';
    intensity?: number;
    metadata?: Record<string, any>;
  }): Promise<UserInterest> {
    return apiClient.post<UserInterest>(`/interests/users/${userId}`, data);
  }

  /**
   * Массовое добавление интересов пользователя
   */
  async setMultipleUserInterests(userId: string, data: {
    interests: Array<{
      interest_id: string;
      preference: 'love' | 'like' | 'neutral' | 'dislike';
      intensity?: number;
    }>;
  }): Promise<UserInterest[]> {
    return apiClient.post<UserInterest[]>(`/interests/users/${userId}/batch`, data);
  }

  /**
   * Удалить интерес пользователя
   */
  async removeUserInterest(userId: string, interestId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/interests/users/${userId}/${interestId}`);
  }

  /**
   * Обновить активность интереса
   */
  async updateInterestActivity(userId: string, interestId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/interests/users/${userId}/${interestId}/activity`);
  }

  /**
   * Найти общие интересы между пользователями
   */
  async getCommonInterests(userId1: string, userId2: string): Promise<UserInterest[]> {
    return apiClient.get<UserInterest[]>(`/interests/common/${userId1}/${userId2}`);
  }

  // ===== НОВЫЕ CLICKHOUSE & ML МЕТОДЫ =====

  /**
   * Получить аналитику интересов пользователя
   */
  async getUserInterestsAnalytics(userId: string): Promise<InterestAnalytics> {
    return apiClient.get<InterestAnalytics>(`/interests/users/${userId}/analytics`);
  }

  /**
   * Получить топ интересы с аналитикой
   */
  async getTopInterestsAnalytics(params?: {
    limit?: number;
    days?: number;
  }): Promise<TopInterest[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.days) queryParams.append('days', params.days.toString());
    
    const url = `/interests/analytics/top${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<TopInterest[]>(url);
  }

  /**
   * Найти похожих пользователей по интересам
   */
  async findSimilarUsers(userId: string, limit = 10): Promise<Array<{
    user_id: string;
    similarity: number;
    model_version: string;
  }>> {
    return apiClient.get(`/interests/users/${userId}/similar?limit=${limit}`);
  }

  /**
   * Получить рекомендации интересов для пользователя
   */
  async getInterestRecommendations(userId: string, limit = 10): Promise<InterestRecommendation[]> {
    return apiClient.get<InterestRecommendation[]>(`/interests/users/${userId}/recommendations?limit=${limit}`);
  }

  /**
   * Обновить эмбеддинг пользователя вручную
   */
  async updateUserEmbedding(userId: string): Promise<{
    message: string;
    embedding_size?: number;
  }> {
    return apiClient.post(`/interests/users/${userId}/embedding/update`);
  }

  /**
   * Вычислить совместимость с другим пользователем
   */
  async calculateUserCompatibility(userId: string, targetUserId: string): Promise<UserCompatibility> {
    return apiClient.post<UserCompatibility>(`/interests/users/${userId}/compatibility`, {
      targetUserId
    });
  }

  // ===== УТИЛИТАРНЫЕ МЕТОДЫ =====

  /**
   * Получить статистику интересов (для админки)
   */
  async getInterestsStats(): Promise<{
    total_interests: number;
    total_user_interests: number;
    avg_interests_per_user: number;
    most_popular_category: string;
  }> {
    return apiClient.get('/interests/stats');
  }

  /**
   * Поиск интересов с продвинутыми фильтрами
   */
  async searchInterests(query: string, filters?: {
    categories?: string[];
    minPopularity?: number;
    excludeUserInterests?: boolean;
    userId?: string;
  }): Promise<Interest[]> {
    const params = new URLSearchParams();
    params.append('search', query);
    
    if (filters?.categories?.length) {
      filters.categories.forEach(cat => params.append('categories[]', cat));
    }
    if (filters?.minPopularity) params.append('minPopularity', filters.minPopularity.toString());
    if (filters?.excludeUserInterests) params.append('excludeUserInterests', 'true');
    if (filters?.userId) params.append('userId', filters.userId);
    
    return apiClient.get<Interest[]>(`/interests/search?${params.toString()}`);
  }

  /**
   * Экспорт данных пользователя (GDPR)
   */
  async exportUserInterestData(userId: string): Promise<{
    interests: UserInterest[];
    analytics: InterestAnalytics;
    recommendations: InterestRecommendation[];
    export_date: string;
  }> {
    return apiClient.get(`/interests/users/${userId}/export`);
  }
}

export const interestApi = new InterestApiService();
export default interestApi;

