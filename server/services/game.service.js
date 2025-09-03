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
      return roomWithCount;
    });

    return roomsWithPlayerCount;
  }

  async createRoom(hostId, roomData) {
    console.log(`🎯 [SERVICE] Starting room creation`, {
      timestamp: new Date().toISOString(),
      hostId,
      roomData
    });

    const { bet, gameType, tableType, maxPlayers = 2, gameFormat = '1v1', specialSettings = {} } = roomData;
    
    console.log(`📊 [SERVICE] Extracted room parameters`, {
      timestamp: new Date().toISOString(),
      bet,
      gameType,
      tableType,
      maxPlayers,
      gameFormat,
      specialSettings
    });

    // Проверяем корректность количества игроков для Codenames
    if (gameType === 'codenames' && maxPlayers !== 4) {
      console.error(`❌ [SERVICE] Invalid player count for Codenames`, {
        timestamp: new Date().toISOString(),
        gameType,
        maxPlayers,
        required: 4
      });
      const error = new Error('Codenames requires exactly 4 players (2v2 format)');
      error.statusCode = 400;
      throw error;
    }

    if (!bet || bet <= 0) {
      console.error(`❌ [SERVICE] Invalid bet amount`, {
        timestamp: new Date().toISOString(),
        bet
      });
      const error = new Error('Bet must be a positive number.');
      error.statusCode = 400;
      throw error;
    }
    if (!gameType) {
      console.error(`❌ [SERVICE] Missing gameType`, {
        timestamp: new Date().toISOString()
      });
      const error = new Error('gameType is required.');
      error.statusCode = 400;
      throw error;
    }

    console.log(`💰 [SERVICE] Checking player bet capability`, {
      timestamp: new Date().toISOString(),
      hostId,
      bet
    });

    // Проверяем возможность ставки через экономический сервис
    const canBet = await economyService.canPlayerBet(hostId, bet);
    if (!canBet.canBet) {
      console.error(`❌ [SERVICE] Player cannot make bet`, {
        timestamp: new Date().toISOString(),
        hostId,
        bet,
        reason: canBet.reason
      });
      const error = new Error(canBet.reason);
      error.statusCode = 400;
      throw error;
    }

    console.log(`✅ [SERVICE] Player bet check passed`, {
      timestamp: new Date().toISOString(),
      hostId,
      bet
    });

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
      console.log(`🃏 [SERVICE] Set poker blinds`, {
        timestamp: new Date().toISOString(),
        tableType,
        blinds
      });
    }

    const roomCreateData = {
      host_id: hostId,
      bet,
      gameType,
      maxPlayers,
      tableType: gameType === 'poker' ? tableType : null,
      blinds: gameType === 'poker' ? blinds : null,
      status: 'waiting',
      players: [],
      gameFormat,
      settings: specialSettings
    };

    console.log(`🗄️  [SERVICE] Creating room in database`, {
      timestamp: new Date().toISOString(),
      roomCreateData
    });
    
    const createdRoom = await GameRoom.create(roomCreateData);

    console.log(`✅ [SERVICE] Room created in database successfully`, {
      timestamp: new Date().toISOString(),
      roomId: createdRoom.id,
      createdAt: createdRoom.createdAt,
      status: createdRoom.status
    });

    return createdRoom;
  }

  async deleteRoom(roomId) {
    try {
      const room = await GameRoom.findByPk(roomId);
      if (room) {
        await room.destroy();
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
        }
    } catch (error) {
      console.error(`Error in startGame for room ${roomId}:`, error);
      throw error;
    }
  }
  
  async finalizePokerSession(roomId, finalPlayers, initialBuyIn) {
    const t = await sequelize.transaction();
    try {
        const room = await GameRoom.findByPk(roomId, { transaction: t });
        if (!room) {
            await t.rollback();
            console.warn(`Room ${roomId} not found for finalization.`);
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
                }
        }
        
        // Сессию завершаем, но комнату переводим в ожидание, чтобы можно было продолжить играть позже
        room.status = 'waiting';
        await room.save({ transaction: t });
        
        await t.commit();
        return updatedUsers;

    } catch (error) {
        await t.rollback();
        console.error(`Error finalizing poker session for room ${roomId}:`, error);
        return null;
    }
  }

  async finalizeGame(roomId, winnerId, loserId, isDraw = false) {
    try {
      const room = await GameRoom.findByPk(roomId);
      if (!room) {
        return null;
      }

      const economyType = economyService.getEconomyType(room.gameType);
      
      if (economyType === 'poker') {
        // Для покера используем старую логику
        return null;
      }

      // Для стандартных игр используем новую экономическую систему
      const playerIds = isDraw ? [winnerId, loserId] : [winnerId, loserId];
      const result = await economyService.finalizeStandardGame(roomId, isDraw ? null : winnerId, playerIds, isDraw);
      
      if (result.success) {
        return result.results;
      } else {
        console.error(`Error finalizing game ${roomId}:`, result.reason);
        return null;
      }
    } catch (error) {
      console.error(`Error in finalizeGame for room ${roomId}:`, error);
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