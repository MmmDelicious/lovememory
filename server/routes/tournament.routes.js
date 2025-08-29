const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournament.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// GET /tournaments - get all tournaments with filters
router.get('/', authenticateToken, tournamentController.getTournaments);

// GET /tournaments/active - get active tournaments
router.get('/active', authenticateToken, tournamentController.getActiveTournaments);

// GET /tournaments/my - get user tournaments (created)
router.get('/my', authenticateToken, tournamentController.getMyTournaments);

// GET /tournaments/participations - get tournament participations
router.get('/participations', authenticateToken, tournamentController.getMyParticipations);

// POST /tournaments - create tournament
router.post('/', authenticateToken, tournamentController.createTournament);

// GET /tournaments/:id - get tournament by ID
router.get('/:id', authenticateToken, tournamentController.getTournamentById);

// PUT /tournaments/:id - update tournament
router.put('/:id', authenticateToken, tournamentController.updateTournament);

// POST /tournaments/:id/register - register for tournament
router.post('/:id/register', authenticateToken, tournamentController.registerForTournament);

// DELETE /tournaments/:id/register - cancel registration
router.delete('/:id/register', authenticateToken, tournamentController.unregisterFromTournament);

// POST /tournaments/:id/start - start tournament
router.post('/:id/start', authenticateToken, tournamentController.startTournament);

// POST /tournaments/:id/complete - complete tournament
router.post('/:id/complete', authenticateToken, tournamentController.completeTournament);

// POST /tournaments/:id/cancel - cancel tournament
router.post('/:id/cancel', authenticateToken, tournamentController.cancelTournament);

// GET /tournaments/:id/participants - get participants
router.get('/:id/participants', authenticateToken, tournamentController.getTournamentParticipants);

// GET /tournaments/:id/stats - get tournament stats
router.get('/:id/stats', authenticateToken, tournamentController.getTournamentStats);

// GET /tournaments/:id/lobby - get tournament lobby (status)
router.get('/:id/lobby', authenticateToken, tournamentController.getTournamentLobby);

// GET /tournaments/:id/matches - get tournament matches
router.get('/:id/matches', authenticateToken, tournamentController.getTournamentMatches);

// GET /tournaments/:id/matches/:matchId - get match by ID
router.get('/:id/matches/:matchId', authenticateToken, tournamentController.getMatchById);

// POST /tournaments/:id/matches/:matchId/ready - participant ready for match
router.post('/:id/matches/:matchId/ready', authenticateToken, tournamentController.setMatchReady);

// POST /tournaments/:id/matches/:matchId/start - start match
router.post('/:id/matches/:matchId/start', authenticateToken, tournamentController.startMatch);

// POST /tournaments/:id/matches/:matchId/complete - complete match
router.post('/:id/matches/:matchId/complete', authenticateToken, tournamentController.completeMatch);

module.exports = router;
