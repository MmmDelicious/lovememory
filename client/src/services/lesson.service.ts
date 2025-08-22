import api from './api';
import type { LessonFeedback, Lesson } from '../../types/common';
export interface DailyLessonResponse {
  Lesson: Lesson;
  completionStatus: {
    userCompleted: boolean;
    partnerCompleted: boolean;
    userCompletedAt?: string;
    partnerCompletedAt?: string;
  };
  date: string;
  relationship_id: number;
}
export interface LessonProgress {
  pair: {
    streak: number;
    fullyCompleted: number;
    completionRate: number;
    totalAssigned: number;
    relationshipMetrics: {
      heat_score: number;
      love_language_primary: string;
      relationship_stage: string;
    };
  };
  user: {
    totalCompleted: number;
    completedLast30Days: number;
    totalCoinsEarned: number;
    totalStreakBonus: number;
    currentStreak: number;
  };
  partner: {
    totalCompleted: number;
    completedLast30Days: number;
    totalCoinsEarned: number;
    totalStreakBonus: number;
  };
  themes: {
    [key: string]: {
      user: number;
      partner: number;
      total: number;
      percentage: number;
      lastCompleted?: string;
    };
  };
}
export interface LessonHistoryItem {
  id: number;
  lesson_id: string;
  completed_at: string;
  coins_earned: number;
  streak_bonus: number;
  feedback?: LessonFeedback;
  Lesson: Lesson;
}
export interface LessonStats {
  totalCompleted: number;
  completedLast30Days: number;
  currentStreak: number;
  totalCoinsEarned: number;
  totalStreakBonus: number;
  weeklyLessons: number;
}
class LessonService {
  async getTodaysLesson(): Promise<DailyLessonResponse> {
    console.log('🎯 LessonService: Fetching daily lesson...');
    try {
      const response = await api.get('/lessons/daily');
      console.log('✅ LessonService: Daily lesson response:', response.data);
      return response.data.data;
    } catch (error: unknown) {
      console.error('❌ LessonService: Failed to fetch daily lesson:', error);
      throw new Error(error.response?.data?.message || 'Не удалось загрузить урок дня');
    }
  }
  async completeLesson(lessonId: string, feedback?: string): Promise<any> {
    console.log('🎯 LessonService: Completing lesson:', lessonId, { feedback });
    try {
      const response = await api.post(`/lessons/${lessonId}/complete`, {
        feedback,
        completionTime: Date.now()
      });
      console.log('✅ LessonService: Lesson completion response:', response.data);
      return response.data.data;
    } catch (error: unknown) {
      console.error('❌ LessonService: Failed to complete lesson:', error);
      throw new Error(error.response?.data?.message || 'Не удалось выполнить урок');
    }
  }
  async getProgress(): Promise<LessonProgress> {
    console.log('🎯 LessonService: Fetching lesson progress...');
    try {
      const response = await api.get('/lessons/progress');
      console.log('✅ LessonService: Lesson progress response:', response.data);
      return response.data.data;
    } catch (error: unknown) {
      console.error('❌ LessonService: Failed to fetch lesson progress:', error);
      throw new Error(error.response?.data?.message || 'Не удалось загрузить прогресс');
    }
  }
  async getLessonHistory(page: number = 1, limit: number = 20, theme?: string): Promise<{
    lessons: LessonHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (theme) {
        params.append('theme', theme);
      }
      const response = await api.get(`/lessons/history?${params}`);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(error.response?.data?.message || 'Не удалось загрузить историю уроков');
    }
  }
  async getStats(): Promise<LessonStats> {
    try {
      const response = await api.get('/lessons/stats');
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(error.response?.data?.message || 'Не удалось загрузить статистику');
    }
  }
  async getThemeProgress(): Promise<{
    [key: string]: {
      completed: number;
      total: number;
      percentage: number;
      lastCompleted?: string;
    };
  }> {
    try {
      const response = await api.get('/lessons/themes');
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(error.response?.data?.message || 'Не удалось загрузить прогресс по темам');
    }
  }
  async updateRelationshipMetrics(metrics: {
    love_language_primary?: string;
    love_language_secondary?: string;
    attachment_style?: string;
    relationship_stage?: string;
  }): Promise<any> {
    try {
      const response = await api.post('/lessons/relationship/metrics', metrics);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(error.response?.data?.message || 'Не удалось обновить метрики отношений');
    }
  }
  async getWeeklyLessons(weekOffset: number = 0): Promise<any[]> {
    try {
      const response = await api.get(`/lessons/weekly?weekOffset=${weekOffset}`);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(error.response?.data?.message || 'Не удалось загрузить недельные уроки');
    }
  }
  async getLessonRecommendations(): Promise<Lesson[]> {
    try {
      const response = await api.get('/lessons/recommendations');
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(error.response?.data?.message || 'Не удалось загрузить рекомендации');
    }
  }
  async searchLessons(query: string, filters?: {
    theme?: string;
    difficulty?: number;
    interactiveType?: string;
  }): Promise<Lesson[]> {
    try {
      const params = new URLSearchParams({ query });
      if (filters?.theme) params.append('theme', filters.theme);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty.toString());
      if (filters?.interactiveType) params.append('interactiveType', filters.interactiveType);
      const response = await api.get(`/lessons/search?${params}`);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(error.response?.data?.message || 'Не удалось найти уроки');
    }
  }
  async getAchievements(): Promise<any[]> {
    try {
      const response = await api.get('/lessons/achievements');
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(error.response?.data?.message || 'Не удалось загрузить достижения');
    }
  }
  async checkUnlockedThemes(): Promise<string[]> {
    try {
      const response = await api.get('/lessons/unlocked-themes');
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(error.response?.data?.message || 'Не удалось проверить разблокированные темы');
    }
  }
  async submitLessonFeedback(lessonId: string, rating: number, comment?: string): Promise<void> {
    try {
      await api.post(`/lessons/${lessonId}/feedback`, {
        rating,
        comment
      });
    } catch (error: unknown) {
      throw new Error(error.response?.data?.message || 'Не удалось отправить отзыв');
    }
  }
  async getLessonCalendar(year: number, month: number): Promise<{
    [date: string]: {
      completed: boolean;
      lessonTitle: string;
      coins: number;
    };
  }> {
    try {
      const response = await api.get(`/lessons/calendar?year=${year}&month=${month}`);
      return response.data.data;
    } catch (error: unknown) {
      throw new Error(error.response?.data?.message || 'Не удалось загрузить календарь уроков');
    }
  }
}
export const lessonService = new LessonService();

