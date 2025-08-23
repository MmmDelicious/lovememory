const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Применяем аутентификацию ко всем маршрутам
router.use(authMiddleware);

// POST /sessions/start - стартовать новую сессию
router.post('/start', sessionController.startSession);

// GET /sessions/active - получить активные сессии
router.get('/active', sessionController.getActiveSessions);

// GET /sessions/my - получить мои созданные сессии
router.get('/my', sessionController.getMySessions);

// GET /sessions/popular-types - получить популярные типы сессий
router.get('/popular-types', sessionController.getPopularSessionTypes);

// GET /sessions/pair/:pairId - получить сессии для пары
router.get('/pair/:pairId', sessionController.getSessionsForPair);

// GET /sessions/pair/:pairId/stats - получить статистику сессий для пары
router.get('/pair/:pairId/stats', sessionController.getSessionStats);

// GET /sessions/pair/:pairId/by-date - получить сессии по дате
router.get('/pair/:pairId/by-date', sessionController.getSessionsByDate);

// GET /sessions/:id - получить сессию по ID
router.get('/:id', sessionController.getSessionById);

// PUT /sessions/:id - обновить сессию
router.put('/:id', sessionController.updateSession);

// POST /sessions/:id/pause - поставить сессию на паузу
router.post('/:id/pause', sessionController.pauseSession);

// POST /sessions/:id/resume - возобновить сессию
router.post('/:id/resume', sessionController.resumeSession);

// POST /sessions/:id/complete - завершить сессию
router.post('/:id/complete', sessionController.completeSession);

// POST /sessions/:id/cancel - отменить сессию
router.post('/:id/cancel', sessionController.cancelSession);

// POST /sessions/:id/goals - добавить цель к сессии
router.post('/:id/goals', sessionController.addGoalToSession);

// POST /sessions/:id/achievements - добавить достижение к сессии
router.post('/:id/achievements', sessionController.addAchievementToSession);

// PUT /sessions/:id/progress - обновить прогресс сессии
router.put('/:id/progress', sessionController.updateSessionProgress);

module.exports = router;
