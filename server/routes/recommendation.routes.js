const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Маршруты для AI рекомендаций
 */

// Получить рекомендации для пары
router.get('/:pairId', authMiddleware, recommendationController.getRecommendations);

// Логировать клик по рекомендации
router.post('/:pairId/click', authMiddleware, recommendationController.logRecommendationClick);

// Получить метрики модели
router.get('/metrics', recommendationController.getModelMetrics);

// Обновить весовые коэффициенты модели
router.put('/weights', authMiddleware, recommendationController.updateModelWeights);

module.exports = router;
