const express = require('express');
const router = express.Router();
const giftController = require('../controllers/gift.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const uploadMiddleware = require('../middleware/upload.middleware');

// Send gift (with photo upload option)
router.post('/send', authenticateToken, uploadMiddleware.single('photo'), giftController.sendGift);

// Get gifts list
router.get('/', authenticateToken, giftController.getGifts);

// Get unviewed gifts
router.get('/unviewed', authenticateToken, giftController.getUnviewedGifts);

// Get gifts statistics
router.get('/stats', authenticateToken, giftController.getGiftStats);

// Mark gift as viewed
router.patch('/:giftId/viewed', authenticateToken, giftController.markGiftAsViewed);

module.exports = router;
