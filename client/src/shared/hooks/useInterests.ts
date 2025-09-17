import { useState, useEffect, useCallback } from 'react';
import { interestApi, Interest, UserInterest, InterestRecommendation, InterestAnalytics } from '../services/interest.api';

/**
 * Хук для работы со всеми интересами
 */
export const useInterests = (params?: {
  category?: string;
  search?: string;
  limit?: number;
}) => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await interestApi.getAllInterests(params);
      setInterests(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch interests');
    } finally {
      setLoading(false);
    }
  }, [params?.category, params?.search, params?.limit]);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  return {
    interests,
    loading,
    error,
    refetch: fetchInterests
  };
};

/**
 * Хук для работы с интересами по категориям
 */
export const useInterestsByCategory = () => {
  const [interestsByCategory, setInterestsByCategory] = useState<Record<string, Interest[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterestsByCategory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await interestApi.getInterestsByCategory();
      setInterestsByCategory(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch interests by category');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterestsByCategory();
  }, [fetchInterestsByCategory]);

  return {
    interestsByCategory,
    loading,
    error,
    refetch: fetchInterestsByCategory
  };
};

/**
 * Хук для работы с интересами пользователя
 */
export const useUserInterests = (
  userId: string | null, 
  params?: {
    preference?: 'love' | 'like' | 'neutral' | 'dislike';
    source?: 'postgresql' | 'clickhouse';
  }
) => {
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInterests = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await interestApi.getUserInterests(userId, params);
      setUserInterests(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user interests');
    } finally {
      setLoading(false);
    }
  }, [userId, params?.preference, params?.source]);

  useEffect(() => {
    fetchUserInterests();
  }, [fetchUserInterests]);

  const addInterest = useCallback(async (data: {
    interest_id: string;
    preference: 'love' | 'like' | 'neutral' | 'dislike';
    intensity?: number;
    metadata?: Record<string, any>;
  }) => {
    if (!userId) throw new Error('User ID is required');
    
    try {
      const newInterest = await interestApi.setUserInterest(userId, data);
      setUserInterests(prev => {
        const existing = prev.find(i => i.interest_id === data.interest_id);
        if (existing) {
          return prev.map(i => i.interest_id === data.interest_id ? newInterest : i);
        }
        return [...prev, newInterest];
      });
      return newInterest;
    } catch (err: any) {
      setError(err.message || 'Failed to add interest');
      throw err;
    }
  }, [userId]);

  const removeInterest = useCallback(async (interestId: string) => {
    if (!userId) throw new Error('User ID is required');
    
    try {
      await interestApi.removeUserInterest(userId, interestId);
      setUserInterests(prev => prev.filter(i => i.interest_id !== interestId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove interest');
      throw err;
    }
  }, [userId]);

  const updateActivity = useCallback(async (interestId: string) => {
    if (!userId) throw new Error('User ID is required');
    
    try {
      await interestApi.updateInterestActivity(userId, interestId);
    } catch (err: any) {
      console.error('Failed to update interest activity:', err);
    }
  }, [userId]);

  return {
    userInterests,
    loading,
    error,
    refetch: fetchUserInterests,
    addInterest,
    removeInterest,
    updateActivity
  };
};

/**
 * Хук для рекомендаций интересов
 */
export const useInterestRecommendations = (userId: string | null, limit = 10) => {
  const [recommendations, setRecommendations] = useState<InterestRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await interestApi.getInterestRecommendations(userId, limit);
      setRecommendations(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const refreshRecommendations = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Обновляем эмбеддинг пользователя
      await interestApi.updateUserEmbedding(userId);
      // Затем получаем новые рекомендации
      await fetchRecommendations();
    } catch (err: any) {
      setError(err.message || 'Failed to refresh recommendations');
    }
  }, [userId, fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations,
    refreshRecommendations
  };
};

/**
 * Хук для аналитики интересов пользователя
 */
export const useUserInterestsAnalytics = (userId: string | null) => {
  const [analytics, setAnalytics] = useState<InterestAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await interestApi.getUserInterestsAnalytics(userId);
      setAnalytics(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
};

/**
 * Хук для совместимости пользователей
 */
export const useUserCompatibility = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateCompatibility = useCallback(async (userId1: string, userId2: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await interestApi.calculateUserCompatibility(userId1, userId2);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to calculate compatibility');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    calculateCompatibility,
    loading,
    error
  };
};

/**
 * Хук для популярных интересов
 */
export const usePopularInterests = (limit = 20) => {
  const [popularInterests, setPopularInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPopularInterests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await interestApi.getPopularInterests(limit);
      setPopularInterests(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch popular interests');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPopularInterests();
  }, [fetchPopularInterests]);

  return {
    popularInterests,
    loading,
    error,
    refetch: fetchPopularInterests
  };
};

/**
 * Хук для топ интересов с аналитикой
 */
export const useTopInterestsAnalytics = (params?: { limit?: number; days?: number }) => {
  const [topInterests, setTopInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopInterests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await interestApi.getTopInterestsAnalytics(params);
      setTopInterests(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch top interests analytics');
    } finally {
      setLoading(false);
    }
  }, [params?.limit, params?.days]);

  useEffect(() => {
    fetchTopInterests();
  }, [fetchTopInterests]);

  return {
    topInterests,
    loading,
    error,
    refetch: fetchTopInterests
  };
};

/**
 * Универсальный хук для batch операций с интересами
 */
export const useBatchInterests = (userId: string | null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setBatchInterests = useCallback(async (interests: Array<{
    interest_id: string;
    preference: 'love' | 'like' | 'neutral' | 'dislike';
    intensity?: number;
  }>) => {
    if (!userId) throw new Error('User ID is required');
    
    try {
      setLoading(true);
      setError(null);
      const result = await interestApi.setMultipleUserInterests(userId, { interests });
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to set batch interests');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    setBatchInterests,
    loading,
    error
  };
};

