import api from './api';
const BASE_URL = '/event-templates';
export const eventTemplateService = {
  getTemplates: async () => {
    const response = await api.get(BASE_URL);
    return response;
  },
  createTemplate: async (templateData) => {
    const response = await api.post(BASE_URL, templateData);
    return response;
  },
  updateTemplate: async (templateId, templateData) => {
    const response = await api.put(`${BASE_URL}/${templateId}`, templateData);
    return response;
  },
  deleteTemplate: async (templateId) => {
    const response = await api.delete(`${BASE_URL}/${templateId}`);
    return response;
  },
  getPopularTemplates: async (limit = 5) => {
    const response = await api.get(`${BASE_URL}/popular`, { params: { limit } });
    return response;
  },
  getTemplatesByType: async (eventType) => {
    const response = await api.get(`${BASE_URL}/type/${eventType}`);
    return response;
  },
  searchTemplates: async (query) => {
    const response = await api.get(`${BASE_URL}/search`, { params: { q: query } });
    return response;
  },
  duplicateTemplate: async (templateId, newName) => {
    const response = await api.post(`${BASE_URL}/${templateId}/duplicate`, { name: newName });
    return response;
  },
  incrementUsage: async (templateId) => {
    const response = await api.post(`${BASE_URL}/${templateId}/use`);
    return response;
  }
};
export default eventTemplateService;

