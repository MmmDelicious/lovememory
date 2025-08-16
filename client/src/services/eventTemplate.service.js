import api from './api';

const BASE_URL = '/event-templates';

export const eventTemplateService = {
  // Получить все шаблоны пользователя
  getTemplates: async () => {
    const response = await api.get(BASE_URL);
    return response;
  },

  // Создать новый шаблон
  createTemplate: async (templateData) => {
    const response = await api.post(BASE_URL, templateData);
    return response;
  },

  // Обновить шаблон
  updateTemplate: async (templateId, templateData) => {
    const response = await api.put(`${BASE_URL}/${templateId}`, templateData);
    return response;
  },

  // Удалить шаблон
  deleteTemplate: async (templateId) => {
    const response = await api.delete(`${BASE_URL}/${templateId}`);
    return response;
  },

  // Получить популярные шаблоны
  getPopularTemplates: async (limit = 5) => {
    const response = await api.get(`${BASE_URL}/popular`, { params: { limit } });
    return response;
  },

  // Получить шаблоны по типу
  getTemplatesByType: async (eventType) => {
    const response = await api.get(`${BASE_URL}/type/${eventType}`);
    return response;
  },

  // Поиск шаблонов
  searchTemplates: async (query) => {
    const response = await api.get(`${BASE_URL}/search`, { params: { q: query } });
    return response;
  },

  // Дублировать шаблон
  duplicateTemplate: async (templateId, newName) => {
    const response = await api.post(`${BASE_URL}/${templateId}/duplicate`, { name: newName });
    return response;
  },

  // Увеличить счетчик использования
  incrementUsage: async (templateId) => {
    const response = await api.post(`${BASE_URL}/${templateId}/use`);
    return response;
  }
};

export default eventTemplateService;
