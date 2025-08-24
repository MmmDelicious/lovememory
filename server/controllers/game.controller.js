const gameService = require('../services/game.service');
const GameManager = require('../gameLogic/GameManager');
const activityService = require('../services/activity.service');
class GameController {
  async getRooms(req, res, next) {
    try {
      const { gameType } = req.query;
      const rooms = await gameService.findRooms(gameType, req.io);
      res.status(200).json(rooms);
    } catch (error) {
      next(error);
    }
  }
  async createRoom(req, res, next) {
    try {
      const hostId = req.user.id;
      const newRoom = await gameService.createRoom(hostId, req.body);
      res.status(201).json(newRoom);
    } catch (error) {
      next(error);
    }
  }
  async getValidMoves(req, res, next) {
    try {
      const { roomId, square } = req.body;
      if (!roomId || !square) {
        return res.status(400).json({ error: 'Missing roomId or square' });
      }
      const game = GameManager.getGame(roomId);
      if (!game) {
        return res.status(400).json({ error: 'Game not found' });
      }
      if (game.gameType !== 'chess') {
        return res.status(400).json({ error: 'Invalid game type' });
      }
      if (game.status !== 'in_progress') {
        return res.status(400).json({ error: 'Game not in progress' });
      }
      if (game.getCurrentPlayerId() !== req.user.id) {
        return res.status(400).json({ error: 'Not your turn' });
      }
      const piece = game.game ? game.game.get(square) : null;
      if (!piece) {
        return res.status(400).json({ error: 'No piece at square' });
      }
      const playerIndex = game.players.indexOf(req.user.id);
      const playerColor = playerIndex === 0 ? 'w' : 'b';
      if (piece.color !== playerColor) {
        return res.status(400).json({ error: 'Cannot move opponent\'s piece' });
      }
      const validMoves = game.getValidMoves(square);
      res.status(200).json({ validMoves });
    } catch (error) {
      console.error('[CONTROLLER] Error in getValidMoves:', error);
      next(error);
    }
  }
}
module.exports = new GameController();
