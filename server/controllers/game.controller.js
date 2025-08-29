const gameService = require('../services/game.service');
const GameManager = require('../compiled/gameLogic/GameManagerNew');
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
      if (game.currentPlayerId !== req.user.id) {
        return res.status(400).json({ error: 'Not your turn' });
      }
      // Для нового ChessGameNew проверяем валидность хода через getValidMovesFromSquare
      // Если вернет пустой массив - значит нет валидных ходов с этой клетки
      // Используем метод getValidMovesFromSquare для получения валидных ходов с конкретной клетки
      const validMoves = game.getValidMovesFromSquare ? 
        game.getValidMovesFromSquare(req.user.id, square) : 
        game.getValidMoves ? game.getValidMoves(square) : [];
      
      res.status(200).json({ validMoves });
    } catch (error) {
      console.error('[CONTROLLER] Error in getValidMoves:', error);
      next(error);
    }
  }
}
module.exports = new GameController();
