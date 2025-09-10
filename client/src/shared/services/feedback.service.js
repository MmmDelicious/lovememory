import api from './api';

/**
 * Создать новый отзыв на рекомендацию
 */
export const createFeedback = async (feedbackData) => {
  const response = await api.post('/feedback', feedbackData);
  return response.data;
};

/**
 * Получить фидбэк для пары
 */
export const getFeedbackForPair = async (pairId, params = {}) => {
  const response = await api.get(`/feedback/pairs/${pairId}`, { params });
  return response.data;
};

/**
 * Получить статистику фидбэка для пары
 */
export const getFeedbackStats = async (pairId, entityType = null) => {
  const params = entityType ? { entity_type: entityType } : {};
  const response = await api.get(`/feedback/pairs/${pairId}/stats`, { params });
  return response.data;
};

/**
 * Получить фидбэк, ожидающий ответа
 */
export const getPendingFeedback = async (pairId) => {
  const response = await api.get(`/feedback/pairs/${pairId}/pending`);
  return response.data;
};

/**
 * Получить среднюю оценку для сущности
 */
export const getAverageRating = async (entityType, entityId) => {
  const response = await api.get(`/feedback/entities/${entityType}/${entityId}/rating`);
  return response.data;
};

/**
 * Получить фидбэк текущего пользователя
 */
export const getUserFeedback = async (params = {}) => {
  const response = await api.get('/feedback/my', { params });
  return response.data;
};

/**
 * Обновить существующий фидбэк
 */
export const updateFeedback = async (feedbackId, updateData) => {
  const response = await api.put(`/feedback/${feedbackId}`, updateData);
  return response.data;
};

/**
 * Удалить фидбэк
 */
export const deleteFeedback = async (feedbackId) => {
  const response = await api.delete(`/feedback/${feedbackId}`);
  return response.data;
};

const feedbackService = {
  createFeedback,
  getFeedbackForPair,
  getFeedbackStats,
  getPendingFeedback,
  getAverageRating,
  getUserFeedback,
  updateFeedback,
  deleteFeedback
};

export default feedbackService;
