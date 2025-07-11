const { Router } = require('express');
const { getEvents, createEvent, updateEvent, deleteEvent, uploadFile, getMediaForEvent } = require('../controllers/event.controller');
const authMiddleware = require('../middleware/auth.middleware');
const uploadMiddleware = require('../middleware/upload.middleware');

const router = Router();

router.use(authMiddleware);

router.get('/', getEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

router.get('/:id/media', getMediaForEvent);
router.post('/:id/upload', uploadMiddleware.single('file'), uploadFile);

module.exports = router;