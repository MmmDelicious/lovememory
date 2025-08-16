const { Router } = require('express');
const {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getPopularTemplates,
  getTemplatesByType,
  searchTemplates,
  duplicateTemplate,
  incrementUsage
} = require('../controllers/eventTemplate.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Все роуты требуют авторизации
router.use(authMiddleware);

// Основные CRUD операции
router.get('/', getTemplates);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

// Дополнительные операции
router.get('/popular', getPopularTemplates);
router.get('/search', searchTemplates);
router.get('/type/:type', getTemplatesByType);
router.post('/:id/duplicate', duplicateTemplate);
router.post('/:id/use', incrementUsage);

module.exports = router;
