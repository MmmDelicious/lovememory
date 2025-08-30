const { Router } = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { param, query } = require('express-validator');
const validationMiddleware = require('../middleware/validation.middleware');

const router = Router();

// Применяем аутентификацию ко всем роутам
router.use(authenticateToken);

/**
 * GET /analytics/pairs/:pairId/event-sources - Получить статистику по источникам событий
 */
router.get('/pairs/:pairId/event-sources',
  [
    param('pairId').isUUID().withMessage('Invalid pair ID'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  validationMiddleware.handleValidationErrors,
  analyticsController.getEventSourceStats
);

/**
 * GET /analytics/pairs/:pairId/ai-conversion - Получить конверсию AI рекомендаций
 */
router.get('/pairs/:pairId/ai-conversion',
  [
    param('pairId').isUUID().withMessage('Invalid pair ID')
  ],
  validationMiddleware.handleValidationErrors,
  analyticsController.getAIConversionStats
);

/**
 * GET /analytics/pairs/:pairId/time-based - Получить статистику по времени
 */
router.get('/pairs/:pairId/time-based',
  [
    param('pairId').isUUID().withMessage('Invalid pair ID'),
    query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid period')
  ],
  validationMiddleware.handleValidationErrors,
  analyticsController.getTimeBasedStats
);

module.exports = router;
