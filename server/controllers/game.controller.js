const gameService = require('../services/game.service');

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
}

module.exports = new GameController();