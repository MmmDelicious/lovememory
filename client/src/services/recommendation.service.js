/**
 * Сервис для работы с AI рекомендациями
 */
class RecommendationService {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    }

    /**
     * Получить рекомендации для пары
     * @param {string} pairId - ID пары
     * @param {number} topK - Количество рекомендаций
     * @param {Object} userLocation - Координаты пользователя
     * @returns {Promise<Object>}
     */
    async getRecommendations(pairId, topK = 10, userLocation = null) {
        try {
            const params = new URLSearchParams({
                top_k: topK.toString()
            });

            if (userLocation) {
                params.append('user_location', JSON.stringify(userLocation));
            }

            const response = await fetch(
                `${this.baseURL}/api/recommendations/${pairId}?${params}`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            throw error;
        }
    }

    /**
     * Логировать клик по рекомендации
     * @param {string} pairId - ID пары
     * @param {Object} item - Данные элемента рекомендации
     * @returns {Promise<Object>}
     */
    async logRecommendationClick(pairId, item) {
        try {
            const response = await fetch(
                `${this.baseURL}/api/recommendations/${pairId}/click`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        item_id: item.item_id,
                        item_title: item.title,
                        score: item.score
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error logging recommendation click:', error);
            throw error;
        }
    }

    /**
     * Получить метрики модели
     * @returns {Promise<Object>}
     */
    async getModelMetrics() {
        try {
            const response = await fetch(
                `${this.baseURL}/api/recommendations/metrics`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching model metrics:', error);
            throw error;
        }
    }

    /**
     * Обновить весовые коэффициенты модели
     * @param {Object} weights - Новые веса
     * @returns {Promise<Object>}
     */
    async updateModelWeights(weights) {
        try {
            const response = await fetch(
                `${this.baseURL}/api/recommendations/weights`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ weights })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating model weights:', error);
            throw error;
        }
    }
}

export default new RecommendationService();
