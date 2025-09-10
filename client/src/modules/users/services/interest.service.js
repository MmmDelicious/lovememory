import api from './api';

// Кэш для интересов (простой in-memory кэш)
let interestsCache = null;
let interestsCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

/**
 * Получить все доступные интересы с кэшированием
 */
export const getAllInterests = async () => {
  // Проверяем кэш
  const now = Date.now();
  if (interestsCache && interestsCacheTime && (now - interestsCacheTime) < CACHE_DURATION) {
    return interestsCache;
  }

  try {
    const response = await api.get('/interests');
    
    // Сохраняем в кэш
    interestsCache = response.data;
    interestsCacheTime = now;
    
    return response.data;
  } catch (error) {
    // Если есть старый кэш, возвращаем его при ошибке
    if (interestsCache) {
      console.warn('Используем кэшированные интересы из-за ошибки API:', error);
      return interestsCache;
    }
    throw error;
  }
};

/**
 * Получить интересы, сгруппированные по категориям
 */
export const getInterestsByCategory = async () => {
  const response = await api.get('/interests/categories');
  return response.data;
};

/**
 * Получить популярные интересы
 */
export const getPopularInterests = async (limit = 20) => {
  const response = await api.get(`/interests/popular?limit=${limit}`);
  return response.data;
};

/**
 * Получить интересы пользователя
 */
export const getUserInterests = async (userId, preference = null) => {
  const params = preference ? { preference } : {};
  const response = await api.get(`/interests/users/${userId}`, { params });
  return response.data;
};

/**
 * Добавить/обновить интерес пользователя
 */
export const setUserInterest = async (userId, interestId, preference = 'like', intensity = 5) => {
  const response = await api.post('/interests/users', {
    user_id: userId,
    interest_id: interestId,
    preference,
    intensity
  });
  return response.data;
};

/**
 * Установить несколько интересов пользователя
 */
export const setMultipleUserInterests = async (userId, interests) => {
  try {

    
    // Валидация данных
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId provided');
    }
    
    if (!Array.isArray(interests)) {
      throw new Error('Interests must be an array');
    }
    
    // Фильтруем и очищаем данные
    const validInterests = interests.filter(interest => {
      const isValid = interest && 
                     typeof interest.interest_id === 'string' && 
                     interest.interest_id.trim() !== '' &&
                     ['love', 'like', 'neutral', 'dislike'].includes(interest.preference) &&
                     typeof interest.intensity === 'number' &&
                     interest.intensity >= 1 && 
                     interest.intensity <= 10;
      

      
      return isValid;
    });
    

    
    if (validInterests.length === 0) {
      return [];
    }
    
    const response = await api.post(`/interests/users/${userId}/batch`, {
      interests: validInterests
    });
    

    
    // Очищаем кэш пользовательских интересов после изменения
    clearUserInterestsCache(userId);
    
    return response.data;
  } catch (error) {
    console.error('Error setting multiple user interests:', error);
    throw error;
  }
};

// Кэш для пользовательских интересов
const userInterestsCache = new Map();
const USER_INTERESTS_CACHE_DURATION = 2 * 60 * 1000; // 2 минуты

/**
 * Очистить кэш интересов пользователя
 */
const clearUserInterestsCache = (userId) => {
  userInterestsCache.delete(userId);
};

/**
 * Очистить весь кэш интересов
 */
export const clearInterestsCache = () => {
  interestsCache = null;
  interestsCacheTime = null;
  userInterestsCache.clear();
};

/**
 * Удалить интерес пользователя
 */
export const removeUserInterest = async (userId, interestId) => {
  const response = await api.delete(`/interests/users/${userId}/${interestId}`);
  return response.data;
};

/**
 * Получить общие интересы с партнером
 */
export const getCommonInterests = async (userId, partnerId) => {
  const response = await api.get(`/interests/common/${userId}/${partnerId}`);
  return response.data;
};

/**
 * Обновить активность интереса
 */
export const updateInterestActivity = async (interestId, activity) => {
  const response = await api.patch(`/interests/${interestId}/activity`, { activity });
  return response.data;
};

const interestService = {
  getAllInterests,
  getInterestsByCategory,
  getPopularInterests,
  getUserInterests,
  setUserInterest,
  setMultipleUserInterests,
  removeUserInterest,
  getCommonInterests,
  updateInterestActivity
};

export default interestService;