import api from './api';
export const askAI = async (prompt, context) => {
  try {
    const response = await api.post('/ai/chat', { prompt, context });
    return response.data;
  } catch (error) {
    console.error("Error asking AI:", error);
    const errorMessage = error.response?.data?.message || "Не удалось получить ответ от AI. Попробуйте позже.";
    return { text: errorMessage };
  }
};
