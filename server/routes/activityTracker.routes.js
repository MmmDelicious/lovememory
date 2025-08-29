/**
 * Activity Tracker Routes - API for activity tracker
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const activityTrackerController = require('../controllers/activityTracker.controller');

// Main tracker routes
router.get('/tracker', authenticateToken, activityTrackerController.getOrCreateTracker);
router.post('/activity', authenticateToken, activityTrackerController.updateDailyActivity);
router.get('/stats', authenticateToken, activityTrackerController.getUserStats);
router.get('/achievements', authenticateToken, activityTrackerController.getUserAchievements);

// Routes for pairs
router.get('/pair/:pairId/stats', authenticateToken, activityTrackerController.getPairStats);

// Goals management
router.put('/goals', authenticateToken, activityTrackerController.updateGoals);

// Sync with external sources
router.post('/sync', authenticateToken, activityTrackerController.syncExternalData);

// Лидерборд
router.get('/leaderboard', authenticateToken, activityTrackerController.getActivityLeaderboard);

module.exports = router;
