const { Router } = require('express');
const gameController = require('../controllers/game.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();

// Защищаем все игровые маршруты
router.use(authMiddleware);

// GET /api/games -> для получения списка комнат
router.get('/', gameController.getRooms);

// POST /api/games/room -> для создания комнаты
router.post('/room', gameController.createRoom);

// POST /api/games/valid-moves -> для получения возможных ходов в шахматах
router.post('/valid-moves', gameController.getValidMoves);

module.exports = router;