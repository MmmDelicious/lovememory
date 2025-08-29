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
const { authenticateToken } = require('../middleware/auth.middleware');

const router = Router();

// Basic CRUD operations
router.get('/', authenticateToken, getTemplates);
router.post('/', authenticateToken, createTemplate);
router.put('/:id', authenticateToken, updateTemplate);
router.delete('/:id', authenticateToken, deleteTemplate);

// Additional operations
router.get('/popular', authenticateToken, getPopularTemplates);
router.get('/search', authenticateToken, searchTemplates);
router.get('/type/:type', authenticateToken, getTemplatesByType);
router.post('/:id/duplicate', authenticateToken, duplicateTemplate);
router.post('/:id/use', authenticateToken, incrementUsage);

module.exports = router;
