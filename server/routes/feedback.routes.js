const { Router } = require('express');
const feedbackController = require('../controllers/feedback.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { body, param, query } = require('express-validator');
const validationMiddleware = require('../middleware/validation.middleware');

const router = Router();

// Применяем аутентификацию ко всем роутам
router.use(authenticateToken);

/**
 * POST /feedback - Создать новый отзыв на рекомендацию
 */
router.post('/',
  [
    body('pair_id').isUUID().withMessage('Valid pair_id is required'),
    body('entity_type').isIn([
      'place', 'activity', 'event', 'insight', 'date_idea', 'gift', 'lesson', 'game', 'other'
    ]).withMessage('Valid entity_type is required'),
    body('entity_id').isString().notEmpty().withMessage('entity_id is required'),
    body('value').isInt({ min: 1, max: 10 }).withMessage('Value must be between 1 and 10'),
    body('entity_data').optional().isObject().withMessage('entity_data must be an object'),
    body('comment').optional().isString().trim().isLength({ max: 1000 }).withMessage('Comment too long'),
    body('recommendation_context').optional().isObject().withMessage('recommendation_context must be an object'),
    body('feedback_type').optional().isIn(['rating', 'visited', 'not_visited', 'cancelled']),
    body('recommendation_date').optional().isISO8601().withMessage('Invalid recommendation_date'),
    body('visit_date').optional().isISO8601().withMessage('Invalid visit_date'),
    body('tags').optional().isArray().withMessage('tags must be an array')
  ],
  validationMiddleware.handleValidationErrors,
  feedbackController.createFeedback
);

/**
 * GET /feedback/pairs/:pairId - Получить фидбэк для пары
 */
router.get('/pairs/:pairId',
  [
    param('pairId').isUUID().withMessage('Invalid pair ID'),
    query('entity_type').optional().isIn([
      'place', 'activity', 'event', 'insight', 'date_idea', 'gift', 'lesson', 'game', 'other'
    ]),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 })
  ],
  validationMiddleware.handleValidationErrors,
  feedbackController.getFeedbackForPair
);

/**
 * GET /feedback/pairs/:pairId/stats - Получить статистику фидбэка для пары
 */
router.get('/pairs/:pairId/stats',
  [
    param('pairId').isUUID().withMessage('Invalid pair ID'),
    query('entity_type').optional().isIn([
      'place', 'activity', 'event', 'insight', 'date_idea', 'gift', 'lesson', 'game', 'other'
    ])
  ],
  validationMiddleware.handleValidationErrors,
  feedbackController.getFeedbackStats
);

/**
 * GET /feedback/pairs/:pairId/pending - Получить фидбэк, ожидающий ответа
 */
router.get('/pairs/:pairId/pending',
  [
    param('pairId').isUUID().withMessage('Invalid pair ID')
  ],
  validationMiddleware.handleValidationErrors,
  feedbackController.getPendingFeedback
);

/**
 * GET /feedback/entities/:entity_type/:entity_id/rating - Получить среднюю оценку для сущности
 */
router.get('/entities/:entity_type/:entity_id/rating',
  [
    param('entity_type').isIn([
      'place', 'activity', 'event', 'insight', 'date_idea', 'gift', 'lesson', 'game', 'other'
    ]).withMessage('Valid entity_type is required'),
    param('entity_id').isString().notEmpty().withMessage('entity_id is required')
  ],
  validationMiddleware.handleValidationErrors,
  feedbackController.getAverageRating
);

/**
 * GET /feedback/my - Получить фидбэк текущего пользователя
 */
router.get('/my',
  [
    query('entity_type').optional().isIn([
      'place', 'activity', 'event', 'insight', 'date_idea', 'gift', 'lesson', 'game', 'other'
    ]),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 })
  ],
  validationMiddleware.handleValidationErrors,
  feedbackController.getUserFeedback
);

/**
 * PUT /feedback/:feedbackId - Обновить существующий фидбэк
 */
router.put('/:feedbackId',
  [
    param('feedbackId').isUUID().withMessage('Invalid feedback ID'),
    body('value').optional().isInt({ min: 1, max: 10 }).withMessage('Value must be between 1 and 10'),
    body('comment').optional().isString().trim().isLength({ max: 1000 }).withMessage('Comment too long'),
    body('feedback_type').optional().isIn(['rating', 'visited', 'not_visited', 'cancelled']),
    body('visit_date').optional().isISO8601().withMessage('Invalid visit_date'),
    body('tags').optional().isArray().withMessage('tags must be an array')
  ],
  validationMiddleware.handleValidationErrors,
  feedbackController.updateFeedback
);

/**
 * DELETE /feedback/:feedbackId - Удалить фидбэк
 */
router.delete('/:feedbackId',
  [
    param('feedbackId').isUUID().withMessage('Invalid feedback ID')
  ],
  validationMiddleware.handleValidationErrors,
  feedbackController.deleteFeedback
);

module.exports = router;
