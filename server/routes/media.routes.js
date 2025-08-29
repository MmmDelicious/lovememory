const { Router } = require('express');
const { moveMediaToEvent } = require('../controllers/event.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = Router();

// Route for moving media between events
router.put('/:mediaId/move', authenticateToken, moveMediaToEvent);

module.exports = router; 