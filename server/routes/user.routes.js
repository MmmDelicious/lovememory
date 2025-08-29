const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// User profile
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, upload.single('avatar'), userController.updateProfile);

// User statistics
router.get('/stats', authenticateToken, userController.getProfileStats);

// Avatar upload
router.post('/avatar', authenticateToken, upload.single('avatar'), userController.uploadAvatar);

// Visited places history (new endpoint)
router.get('/place-history', authenticateToken, userController.getPlaceHistory);
router.post('/place-history', authenticateToken, userController.addPlaceToHistory);

// User search
router.get('/search', authenticateToken, userController.searchUsers);

// FCM token save
router.post('/fcm-token', authenticateToken, userController.saveFCMToken);

// Get user activities for analytics
router.get('/activities', authenticateToken, userController.getUserActivities);

module.exports = router;