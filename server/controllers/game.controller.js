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
      console.log(`🏗️  [CONTROLLER] Creating room for host ${hostId}`, {
        timestamp: new Date().toISOString(),
        hostId,
        requestBody: req.body,
        userEmail: req.user.email
      });
      
      const newRoom = await gameService.createRoom(hostId, req.body);
      
      console.log(`✅ [CONTROLLER] Room created successfully`, {
        timestamp: new Date().toISOString(),
        roomId: newRoom.id,
        gameType: newRoom.gameType,
        bet: newRoom.bet,
        maxPlayers: newRoom.maxPlayers
      });
      
      res.status(201).json(newRoom);
    } catch (error) {
      console.error(`❌ [CONTROLLER] Room creation failed`, {
        timestamp: new Date().toISOString(),
        hostId: req.user?.id,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }
  async getValidMoves(req, res, next) {
    try {
      console.log(`🔍 [GAME CONTROLLER] getValidMoves called`, {
        timestamp: new Date().toISOString(),
        userId: req.user?.id,
        body: req.body
      });

      const { roomId, square } = req.body;
      if (!roomId || !square) {
        console.log(`❌ [GAME CONTROLLER] Missing parameters:`, { roomId, square });
        return res.status(400).json({ error: 'Missing roomId or square' });
      }
      
      const game = GameManager.getGame(roomId);
      console.log(`🎮 [GAME CONTROLLER] Game found:`, {
        roomId,
        gameFound: !!game,
        gameType: game?.gameType,
        gameStatus: game?.status,
        currentPlayerId: game?.currentPlayerId,
        hasGetValidMovesFromSquare: !!game?.getValidMovesFromSquare,
        hasGetValidMoves: !!game?.getValidMoves
      });

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
      let validMoves = [];
      
      if (game.getValidMovesFromSquare) {
        console.log(`📋 [GAME CONTROLLER] Using getValidMovesFromSquare method`);
        validMoves = game.getValidMovesFromSquare(req.user.id, square);
      } else if (game.getValidMoves) {
        console.log(`📋 [GAME CONTROLLER] Using getValidMoves method`);
        validMoves = game.getValidMoves(square);
      } else {
        console.log(`❌ [GAME CONTROLLER] No valid moves method found on game`);
        validMoves = [];
      }
      
      console.log(`✅ [GAME CONTROLLER] Valid moves found:`, {
        square,
        validMovesCount: validMoves.length,
        validMoves
      });
      
      res.status(200).json({ validMoves });
    } catch (error) {
      console.error(`❌ [GAME CONTROLLER] Error in getValidMoves:`, {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        body: req.body
      });
      next(error);
    }
  }
}
module.exports = new GameController();
