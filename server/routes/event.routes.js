const { Router } = require('express');
const { getEvents, createEvent, updateEvent, deleteEvent, uploadFile, getMediaForEvent } = require('../controllers/event.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const uploadMiddleware = require('../middleware/upload.middleware');

const router = Router();

router.get('/', authenticateToken, getEvents);
router.post('/', authenticateToken, createEvent);
router.put('/:id', authenticateToken, updateEvent);
router.delete('/:id', authenticateToken, deleteEvent);

router.get('/:id/media', authenticateToken, getMediaForEvent);
router.post('/:id/upload', authenticateToken, uploadMiddleware.single('file'), uploadFile);

module.exports = router;