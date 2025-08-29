const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// POST /sessions/start - start new session
router.post('/start', authenticateToken, sessionController.startSession);

// GET /sessions/active - get active sessions
router.get('/active', authenticateToken, sessionController.getActiveSessions);

// GET /sessions/my - get my created sessions
router.get('/my', authenticateToken, sessionController.getMySessions);

// GET /sessions/popular-types - get popular session types
router.get('/popular-types', authenticateToken, sessionController.getPopularSessionTypes);

// GET /sessions/pair/:pairId - get sessions for pair
router.get('/pair/:pairId', authenticateToken, sessionController.getSessionsForPair);

// GET /sessions/pair/:pairId/stats - get session stats for pair
router.get('/pair/:pairId/stats', authenticateToken, sessionController.getSessionStats);

// GET /sessions/pair/:pairId/by-date - get sessions by date
router.get('/pair/:pairId/by-date', authenticateToken, sessionController.getSessionsByDate);

// GET /sessions/:id - get session by ID
router.get('/:id', authenticateToken, sessionController.getSessionById);

// PUT /sessions/:id - update session
router.put('/:id', authenticateToken, sessionController.updateSession);

// POST /sessions/:id/pause - pause session
router.post('/:id/pause', authenticateToken, sessionController.pauseSession);

// POST /sessions/:id/resume - resume session
router.post('/:id/resume', authenticateToken, sessionController.resumeSession);

// POST /sessions/:id/complete - complete session
router.post('/:id/complete', authenticateToken, sessionController.completeSession);

// POST /sessions/:id/cancel - cancel session
router.post('/:id/cancel', authenticateToken, sessionController.cancelSession);

// POST /sessions/:id/goals - add goal to session
router.post('/:id/goals', authenticateToken, sessionController.addGoalToSession);

// POST /sessions/:id/achievements - add achievement to session
router.post('/:id/achievements', authenticateToken, sessionController.addAchievementToSession);

// PUT /sessions/:id/progress - update session progress
router.put('/:id/progress', authenticateToken, sessionController.updateSessionProgress);

module.exports = router;
