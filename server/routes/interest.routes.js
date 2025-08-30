const { Router } = require('express');
const interestController = require('../controllers/interest.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { body, param, query } = require('express-validator');
const validationMiddleware = require('../middleware/validation.middleware');



const router = Router();

// Применяем аутентификацию ко всем роутам
router.use(authenticateToken);

/**
 * GET /interests - Получить все интересы
 */
router.get('/', 
  [
    query('category').optional().isIn([
      'food', 'cinema', 'hobby', 'sport', 'travel', 'music', 'art', 'books', 
      'games', 'nature', 'technology', 'fashion', 'cooking', 'fitness', 
      'photography', 'dancing', 'shopping', 'animals', 'cars', 'crafts', 
      'education', 'volunteering', 'other'
    ]).withMessage('Invalid category'),
    query('search').optional().isString().trim().isLength({ min: 1, max: 100 }),
    query('limit').optional().isInt({ min: 1, max: 200 })
  ],
  validationMiddleware.handleValidationErrors,
  interestController.getAllInterests
);

/**
 * GET /interests/categories - Получить интересы, сгруппированные по категориям
 */
router.get('/categories', interestController.getInterestsByCategory);

/**
 * GET /interests/popular - Получить популярные интересы
 */
router.get('/popular',
  [
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validationMiddleware.handleValidationErrors,
  interestController.getPopularInterests
);

/**
 * GET /interests/users/:userId - Получить интересы пользователя
 */
router.get('/users/:userId',
  [
    param('userId').isUUID().withMessage('Invalid user ID'),
    query('preference').optional().isIn(['love', 'like', 'neutral', 'dislike'])
  ],
  validationMiddleware.handleValidationErrors,
  interestController.getUserInterests
);

/**
 * POST /interests/users/:userId - Добавить/обновить интерес пользователя
 */
router.post('/users/:userId',
  [
    param('userId').isUUID().withMessage('Invalid user ID'),
    body('interest_id').isUUID().withMessage('Valid interest_id is required'),
    body('preference').isIn(['love', 'like', 'neutral', 'dislike']).withMessage('Valid preference is required'),
    body('intensity').optional().isInt({ min: 1, max: 10 }).withMessage('Intensity must be between 1 and 10'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ],
  validationMiddleware.handleValidationErrors,
  interestController.setUserInterest
);

/**
 * POST /interests/users/:userId/batch - Массовое добавление интересов (для онбординга)
 */
router.post('/users/:userId/batch',
  [
    param('userId').isUUID().withMessage('Invalid user ID'),
    body('interests').isArray({ min: 1 }).withMessage('Interests array is required'),
    body('interests.*.interest_id').isUUID().withMessage('Each interest must have valid interest_id'),
    body('interests.*.preference').isIn(['love', 'like', 'neutral', 'dislike']).withMessage('Each interest must have valid preference'),
    body('interests.*.intensity').optional().isInt({ min: 1, max: 10 }).withMessage('Intensity must be between 1 and 10')
  ],
  validationMiddleware.handleValidationErrors,
  interestController.setMultipleUserInterests
);

/**
 * DELETE /interests/users/:userId/:interestId - Удалить интерес пользователя
 */
router.delete('/users/:userId/:interestId',
  [
    param('userId').isUUID().withMessage('Invalid user ID'),
    param('interestId').isUUID().withMessage('Invalid interest ID')
  ],
  validationMiddleware.handleValidationErrors,
  interestController.removeUserInterest
);

/**
 * GET /interests/common/:userId1/:userId2 - Найти общие интересы между пользователями
 */
router.get('/common/:userId1/:userId2',
  [
    param('userId1').isUUID().withMessage('Invalid user1 ID'),
    param('userId2').isUUID().withMessage('Invalid user2 ID')
  ],
  validationMiddleware.handleValidationErrors,
  interestController.getCommonInterests
);

/**
 * POST /interests/users/:userId/:interestId/activity - Обновить активность интереса
 */
router.post('/users/:userId/:interestId/activity',
  [
    param('userId').isUUID().withMessage('Invalid user ID'),
    param('interestId').isUUID().withMessage('Invalid interest ID')
  ],
  validationMiddleware.handleValidationErrors,
  interestController.updateInterestActivity
);

module.exports = router;
