const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Профиль пользователя
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, upload.single('avatar'), userController.updateProfile);

// Статистика пользователя
router.get('/stats', authMiddleware, userController.getProfileStats);

// Загрузка аватара
router.post('/avatar', authMiddleware, upload.single('avatar'), userController.uploadAvatar);

// История посещенных мест (новый эндпоинт)
router.get('/place-history', authMiddleware, userController.getPlaceHistory);
router.post('/place-history', authMiddleware, userController.addPlaceToHistory);

// Поиск пользователей
router.get('/search', authMiddleware, userController.searchUsers);

// Сохранение FCM токена
router.post('/fcm-token', authMiddleware, userController.saveFCMToken);

// Получение активностей пользователя для аналитики
router.get('/activities', authMiddleware, userController.getUserActivities);

module.exports = router;