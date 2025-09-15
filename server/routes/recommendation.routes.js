const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation.controller');

// ИЗМЕНЕНИЕ ЗДЕСЬ: Используем деструктуризацию, чтобы получить саму функцию
const { authenticateToken } = require('../middleware/auth.middleware');

// Уберите этот console.log, он больше не нужен
// console.log('Imported recommendationController:', recommendationController);

/**
 * Маршруты для AI рекомендаций
 */

// ИЗМЕНЕНИЕ ЗДЕСЬ: Используем правильную переменную 'authenticateToken'
router.get('/:pairId', authenticateToken, recommendationController.getRecommendations);

// ИЗМЕНЕНИЕ ЗДЕСЬ: Используем правильную переменную 'authenticateToken'
router.post('/:pairId/click', authenticateToken, recommendationController.logRecommendationClick);

// Этот маршрут не требует аутентификации, оставляем как есть
router.get('/metrics', recommendationController.getModelMetrics);

// ИЗМЕНЕНИЕ ЗДЕСЬ: Используем правильную переменную 'authenticateToken'
router.put('/weights', authenticateToken, recommendationController.updateModelWeights);

module.exports = router;