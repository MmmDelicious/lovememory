const express = require('express');
const router = express.Router();
const giftController = require('../controllers/gift.controller');
const authMiddleware = require('../middleware/auth.middleware');
const uploadMiddleware = require('../middleware/upload.middleware');

// Все маршруты требуют аутентификации
router.use(authMiddleware);

// Отправить подарок (с возможностью загрузки фото)
router.post('/send', uploadMiddleware.single('photo'), giftController.sendGift);

// Получить список подарков
router.get('/', giftController.getGifts);

// Получить непросмотренные подарки
router.get('/unviewed', giftController.getUnviewedGifts);

// Получить статистику подарков
router.get('/stats', giftController.getGiftStats);

// Отметить подарок как просмотренный
router.patch('/:giftId/viewed', giftController.markGiftAsViewed);

module.exports = router;
