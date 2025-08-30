import api from './api';

/**
 * Получить инсайты для пары
 */
export const getInsightsForPair = async (pairId, params = {}) => {
  const response = await api.get(`/insights/pairs/${pairId}`, { params });
  return response.data;
};

/**
 * Генерировать новые инсайты для пары
 */
export const generateInsights = async (pairId) => {
  const response = await api.post(`/insights/pairs/${pairId}/generate`);
  return response.data;
};

/**
 * Получить статистику инсайтов для пары
 */
export const getInsightStats = async (pairId) => {
  const response = await api.get(`/insights/pairs/${pairId}/stats`);
  return response.data;
};

/**
 * Получить рекомендации на основе инсайтов
 */
export const getInsightRecommendations = async (pairId) => {
  const response = await api.get(`/insights/pairs/${pairId}/recommendations`);
  return response.data;
};

/**
 * Удалить инсайт
 */
export const deleteInsight = async (insightId) => {
  const response = await api.delete(`/insights/${insightId}`);
  return response.data;
};

/**
 * Получить непрочитанные инсайты
 */
export const getUnreadInsights = async (pairId, lastReadDate) => {
  const params = lastReadDate ? { unread_after: lastReadDate } : {};
  const response = await api.get(`/insights/pairs/${pairId}`, { params });
  return response.data;
};

const insightService = {
  getInsightsForPair,
  generateInsights,
  getInsightStats,
  getInsightRecommendations,
  deleteInsight,
  getUnreadInsights
};

export default insightService;
