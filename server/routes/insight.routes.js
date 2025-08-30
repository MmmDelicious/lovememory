const { Router } = require('express');
const insightController = require('../controllers/insight.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { param, query } = require('express-validator');
const validationMiddleware = require('../middleware/validation.middleware');

const router = Router();

// Применяем аутентификацию ко всем роутам
router.use(authenticateToken);

/**
 * GET /insights/pairs/:pairId - Получить инсайты для пары
 */
router.get('/pairs/:pairId',
  [
    param('pairId').isUUID().withMessage('Invalid pair ID'),
    query('type').optional().isIn([
      'compatibility', 'activity_pattern', 'recommendation', 'love_language', 'conflict_analysis', 'growth_opportunity'
    ]).withMessage('Invalid insight type'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('unread_after').optional().isISO8601().withMessage('Invalid date format')
  ],
  validationMiddleware.handleValidationErrors,
  insightController.getInsightsForPair
);

/**
 * POST /insights/pairs/:pairId/generate - Генерировать новые инсайты для пары
 */
router.post('/pairs/:pairId/generate',
  [
    param('pairId').isUUID().withMessage('Invalid pair ID')
  ],
  validationMiddleware.handleValidationErrors,
  insightController.generateInsights
);

/**
 * GET /insights/pairs/:pairId/stats - Получить статистику инсайтов для пары
 */
router.get('/pairs/:pairId/stats',
  [
    param('pairId').isUUID().withMessage('Invalid pair ID')
  ],
  validationMiddleware.handleValidationErrors,
  insightController.getInsightStats
);

/**
 * GET /insights/pairs/:pairId/recommendations - Получить рекомендации на основе инсайтов
 */
router.get('/pairs/:pairId/recommendations',
  [
    param('pairId').isUUID().withMessage('Invalid pair ID')
  ],
  validationMiddleware.handleValidationErrors,
  insightController.getInsightRecommendations
);

/**
 * DELETE /insights/:insightId - Удалить инсайт
 */
router.delete('/:insightId',
  [
    param('insightId').isUUID().withMessage('Invalid insight ID')
  ],
  validationMiddleware.handleValidationErrors,
  insightController.deleteInsight
);

module.exports = router;
