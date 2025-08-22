const { GameRoom, User, sequelize } = require('../models');
const economyService = require('./economy.service');

class GameService {
  async findRooms(gameType, io) {
    if (!gameType) {
      const error = new Error('gameType query parameter is required.');
      error.statusCode = 400;
      throw error;
    }
    
    // Для покера показываем и waiting и in_progress комнаты (можно присоединиться как наблюдатель)
    // Для других игр только waiting (игра уже идет, присоединиться нельзя)
    const statusFilter = gameType === 'poker' ? ['waiting', 'in_progress'] : ['waiting'];
    console.log(`[SERVER] Finding rooms for gameType: ${gameType}, statusFilter:`, statusFilter);
    
    const rooms = await GameRoom.findAll({
      where: { 
        gameType, 
        status: statusFilter 
      },
      include: {
        model: User,
        as: 'Host',
        attributes: ['id', 'first_name']
      },
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true
    });

    console.log(`[SERVER] Found ${rooms.length} rooms in database for ${gameType}`);

    // Оптимизация: получаем информацию о всех комнатах за один проход
    const roomIds = rooms.map(room => room.id);
    const roomSocketsMap = new Map();
    
    // Получаем все комнаты одним запросом
    for (const roomId of roomIds) {
      try {
        const sockets = await io.in(roomId).fetchSockets();
        roomSocketsMap.set(roomId, sockets);
      } catch (error) {
        console.error(`Error fetching sockets for room ${roomId}:`, error);
        roomSocketsMap.set(roomId, []);
      }
    }
    
    const roomsWithPlayerCount = rooms.map((room) => {
      const sockets = roomSocketsMap.get(room.id) || [];
      const roomWithCount = {
        ...room,
        players: sockets.map(s => s.user?.id).filter(Boolean),
        playerCount: sockets.length,
      };
      console.log(`[SERVER] Room ${room.id} (${room.status}) has ${sockets.length} connected players`);
      return roomWithCount;
    });

    console.log(`[SERVER] Returning ${roomsWithPlayerCount.length} rooms for ${gameType}`);
    return roomsWithPlayerCount;
  }

  async createRoom(hostId, roomData) {
    const { bet, gameType, tableType, maxPlayers = 2, gameFormat = '1v1', specialSettings = {} } = roomData;
    
    // Проверяем корректность количества игроков для Codenames
    if (gameType === 'codenames' && maxPlayers !== 4) {
      const error = new Error('Codenames requires exactly 4 players (2v2 format)');
      error.statusCode = 400;
      throw error;
    }

    if (!bet || bet <= 0) {
      const error = new Error('Bet must be a positive number.');
      error.statusCode = 400;
      throw error;
    }
    if (!gameType) {
      const error = new Error('gameType is required.');
      error.statusCode = 400;
      throw error;
    }

    // Проверяем возможность ставки через экономический сервис
    const canBet = await economyService.canPlayerBet(hostId, bet);
    if (!canBet.canBet) {
      const error = new Error(canBet.reason);
      error.statusCode = 400;
      throw error;
    }

    let blinds = null;
    if (gameType === 'poker') {
      switch (tableType) {
        case 'standard':
          blinds = '5/10';
          break;
        case 'premium':
          blinds = '25/50';
          break;
        case 'elite':
          blinds = '100/200';
          break;
        default:
          blinds = '5/10';
      }
    }
    
    return GameRoom.create({
      hostId,
      bet,
      gameType,
      maxPlayers,
      tableType: gameType === 'poker' ? tableType : null,
      blinds: gameType === 'poker' ? blinds : null,
      status: 'waiting',
      players: [],
      gameFormat,
      gameSettings: specialSettings
    });
  }

  async deleteRoom(roomId) {
    try {
      const room = await GameRoom.findByPk(roomId);
      if (room) {
        await room.destroy();
        console.log(`[SERVER] Room ${roomId} has been deleted from the database.`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[SERVER] [ERROR] Failed to delete room ${roomId}:`, error);
      throw error;
    }
  }

  async cleanupOrphanedRooms(io) {
    try {
      const waitingRooms = await GameRoom.findAll({ where: { status: 'waiting' } });
      let deletedCount = 0;

      for (const room of waitingRooms) {
        const sockets = await io.in(room.id).fetchSockets();
        if (sockets.length === 0) {
          await room.destroy();
          deletedCount++;
        }
      }
    } catch (error) {
      // Cleanup error handled silently
    }
  }

  async startGame(roomId) {
    try {
      const room = await GameRoom.findByPk(roomId);
      if (room && room.status === 'waiting') {
        room.status = 'in_progress';
        await room.save();
        console.log(`Статус комнаты ${roomId} изменен на 'in_progress'.`);
      }
    } catch (error) {
      console.error(`!!! Ошибка в startGame для комнаты ${roomId}:`, error);
      throw error;
    }
  }
  
  async finalizePokerSession(roomId, finalPlayers, initialBuyIn) {
    const t = await sequelize.transaction();
    try {
        const room = await GameRoom.findByPk(roomId, { transaction: t });
        if (!room) {
            await t.rollback();
            console.warn(`[FINALIZE_POKER] Room ${roomId} not found for finalization.`);
            return null;
        }

        const updatedUsers = [];
        for (const p of finalPlayers) {
            const user = await User.findByPk(p.id, { transaction: t, lock: true });
            if (user) {
                // В новой логике stack уже в монетах, поэтому просто возвращаем разницу
                const netChange = p.stack - initialBuyIn;
                user.coins += netChange;
                if (user.coins < 0) user.coins = 0;
                await user.save({ transaction: t });
                updatedUsers.push({ id: user.id, coins: user.coins });
                console.log(`[FINALIZE_POKER] User ${user.id} stack changed by ${netChange}. New balance: ${user.coins}`);
            }
        }
        
        // Сессию завершаем, но комнату переводим в ожидание, чтобы можно было продолжить играть позже
        room.status = 'waiting';
        await room.save({ transaction: t });
        
        await t.commit();
        console.log(`[FINALIZE_POKER] Session for room ${roomId} finalized. Room status set to 'waiting'.`);
        return updatedUsers;

    } catch (error) {
        await t.rollback();
        console.error(`[FINALIZE_POKER] Error finalizing poker session for room ${roomId}:`, error);
        return null;
    }
  }

  async finalizeGame(roomId, winnerId, loserId, isDraw = false) {
    try {
      const room = await GameRoom.findByPk(roomId);
      if (!room) {
        console.log(`Комната ${roomId} не найдена`);
        return null;
      }

      const economyType = economyService.getEconomyType(room.gameType);
      
      if (economyType === 'poker') {
        // Для покера используем старую логику
        console.log(`[FINALIZE] Покер игра ${roomId} завершается через PokerGame`);
        return null;
      }

      // Для стандартных игр используем новую экономическую систему
      const playerIds = isDraw ? [winnerId, loserId] : [winnerId, loserId];
      const result = await economyService.finalizeStandardGame(roomId, isDraw ? null : winnerId, playerIds, isDraw);
      
      if (result.success) {
        console.log(`[FINALIZE] Стандартная игра ${roomId} завершена через новую экономическую систему`);
        return result.results;
      } else {
        console.error(`[FINALIZE] Ошибка завершения игры ${roomId}:`, result.reason);
        return null;
      }
    } catch (error) {
      console.error(`[FINALIZE] Ошибка в finalizeGame для комнаты ${roomId}:`, error);
      return null;
    }
  }
  
  /**
   * Очистка завершенных игр (запускается периодически)
   */
  async cleanupFinishedGames() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await GameRoom.destroy({
        where: {
          status: 'finished',
          updatedAt: {
            [require('sequelize').Op.lt]: oneDayAgo
          }
        }
      });
    } catch (error) {
      // Cleanup error handled silently
    }
  }
}

module.exports = new GameService();