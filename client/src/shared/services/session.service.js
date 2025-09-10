import api from './api';

/**
 * Сервис для работы с сессиями активности
 */

// Стартовать новую сессию
const startSession = async (pairId, sessionData) => {
  const response = await api.post('/sessions/start', {
    pair_id: pairId,
    ...sessionData
  });
  return response.data;
};

// Получить активные сессии для пары
const getActiveSessions = async (pairId = null) => {
  const params = pairId ? { pair_id: pairId } : {};
  const response = await api.get('/sessions/active', { params });
  return response.data;
};

// Получить сессии для пары с фильтрами
const getSessionsForPair = async (pairId, filters = {}) => {
  const response = await api.get(`/sessions/pair/${pairId}`, { params: filters });
  return response.data;
};

// Получить сессию по ID
const getSessionById = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}`);
  return response.data;
};

// Поставить сессию на паузу
const pauseSession = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/pause`);
  return response.data;
};

// Возобновить сессию
const resumeSession = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/resume`);
  return response.data;
};

// Завершить сессию
const completeSession = async (sessionId, completionData = {}) => {
  const response = await api.post(`/sessions/${sessionId}/complete`, completionData);
  return response.data;
};

// Отменить сессию
const cancelSession = async (sessionId, reason = null) => {
  const response = await api.post(`/sessions/${sessionId}/cancel`, { reason });
  return response.data;
};

// Добавить цель к сессии
const addGoalToSession = async (sessionId, goal) => {
  const response = await api.post(`/sessions/${sessionId}/goals`, { goal });
  return response.data;
};

// Добавить достижение к сессии
const addAchievementToSession = async (sessionId, achievement) => {
  const response = await api.post(`/sessions/${sessionId}/achievements`, { achievement });
  return response.data;
};

// Обновить прогресс сессии
const updateSessionProgress = async (sessionId, progressData) => {
  const response = await api.put(`/sessions/${sessionId}/progress`, progressData);
  return response.data;
};

// Получить статистику сессий для пары
const getSessionStats = async (pairId, timeframe = 'month') => {
  const response = await api.get(`/sessions/pair/${pairId}/stats`, {
    params: { timeframe }
  });
  return response.data;
};

// Получить мои созданные сессии
const getMySessions = async (limit = 20, offset = 0) => {
  const response = await api.get('/sessions/my', {
    params: { limit, offset }
  });
  return response.data;
};

// Обновить сессию (метаданные, заметки и т.д.)
const updateSession = async (sessionId, updateData) => {
  const response = await api.put(`/sessions/${sessionId}`, updateData);
  return response.data;
};

// Получить популярные типы сессий
const getPopularSessionTypes = async (pairId = null) => {
  const params = pairId ? { pair_id: pairId } : {};
  const response = await api.get('/sessions/popular-types', { params });
  return response.data;
};

// Получить рекомендации для сессий
const getSessionRecommendations = async (pairId, sessionType = null) => {
  const params = { pair_id: pairId };
  if (sessionType) params.session_type = sessionType;
  
  const response = await api.get('/sessions/recommendations', { params });
  return response.data;
};

// Экспортировать историю сессий
const exportSessionHistory = async (pairId, format = 'json') => {
  const response = await api.get(`/sessions/pair/${pairId}/export`, {
    params: { format },
    responseType: format === 'csv' ? 'blob' : 'json'
  });
  return response.data;
};

// Получить детальную аналитику по сессиям
const getSessionAnalytics = async (pairId, period = 'month') => {
  const response = await api.get(`/sessions/pair/${pairId}/analytics`, {
    params: { period }
  });
  return response.data;
};

// Получить сессии по дате
const getSessionsByDate = async (pairId, date) => {
  const response = await api.get(`/sessions/pair/${pairId}/by-date`, {
    params: { date: date.toISOString().split('T')[0] }
  });
  return response.data;
};

const sessionService = {
  startSession,
  getActiveSessions,
  getSessionsForPair,
  getSessionById,
  pauseSession,
  resumeSession,
  completeSession,
  cancelSession,
  addGoalToSession,
  addAchievementToSession,
  updateSessionProgress,
  getSessionStats,
  getMySessions,
  updateSession,
  getPopularSessionTypes,
  getSessionRecommendations,
  exportSessionHistory,
  getSessionAnalytics,
  getSessionsByDate,
};

export default sessionService;
