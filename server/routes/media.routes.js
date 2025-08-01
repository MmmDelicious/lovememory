const { Router } = require('express');
const { moveMediaToEvent } = require('../controllers/event.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

router.use(authMiddleware);

// Маршрут для перемещения медиа между событиями
router.put('/:mediaId/move', moveMediaToEvent);

module.exports = router; 