const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournament.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Применяем аутентификацию ко всем маршрутам
router.use(authMiddleware);

// GET /tournaments - получить все турниры с фильтрами
router.get('/', tournamentController.getTournaments);

// GET /tournaments/active - получить активные турниры
router.get('/active', tournamentController.getActiveTournaments);

// GET /tournaments/my - получить турниры пользователя (созданные)
router.get('/my', tournamentController.getMyTournaments);

// GET /tournaments/participations - получить участие в турнирах
router.get('/participations', tournamentController.getMyParticipations);

// POST /tournaments - создать турнир
router.post('/', tournamentController.createTournament);

// GET /tournaments/:id - получить турнир по ID
router.get('/:id', tournamentController.getTournamentById);

// PUT /tournaments/:id - обновить турнир
router.put('/:id', tournamentController.updateTournament);

// POST /tournaments/:id/register - зарегистрироваться в турнире
router.post('/:id/register', tournamentController.registerForTournament);

// DELETE /tournaments/:id/register - отменить регистрацию
router.delete('/:id/register', tournamentController.unregisterFromTournament);

// POST /tournaments/:id/start - запустить турнир
router.post('/:id/start', tournamentController.startTournament);

// POST /tournaments/:id/complete - завершить турнир
router.post('/:id/complete', tournamentController.completeTournament);

// POST /tournaments/:id/cancel - отменить турнир
router.post('/:id/cancel', tournamentController.cancelTournament);

// GET /tournaments/:id/participants - получить участников
router.get('/:id/participants', tournamentController.getTournamentParticipants);

// GET /tournaments/:id/stats - получить статистику турнира
router.get('/:id/stats', tournamentController.getTournamentStats);

module.exports = router;
