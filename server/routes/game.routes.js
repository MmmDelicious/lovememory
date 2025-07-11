const Router = require('express');
const router = new Router();
const gameController = require('../controllers/game.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

router.post('/rooms', authMiddleware, gameController.createRoom);
router.get('/rooms', authMiddleware, gameController.getRooms);

module.exports = router;