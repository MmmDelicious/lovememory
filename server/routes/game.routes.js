const { Router } = require('express');
const gameController = require('../controllers/game.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = Router();

// GET /api/games -> to get list of rooms
router.get('/', authenticateToken, gameController.getRooms);

// POST /api/games/room -> to create room
router.post('/room', authenticateToken, gameController.createRoom);

// POST /api/games/valid-moves -> to get valid moves in chess
router.post('/valid-moves', authenticateToken, gameController.getValidMoves);

module.exports = router;