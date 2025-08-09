const { GameRoom, User, sequelize } = require('../models');

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

    const roomsWithPlayerCount = await Promise.all(
      rooms.map(async (room) => {
        const sockets = await io.in(room.id).fetchSockets();
        const roomWithCount = {
          ...room,
          players: sockets.map(s => s.user.id),
          playerCount: sockets.length,
        };
        console.log(`[SERVER] Room ${room.id} (${room.status}) has ${sockets.length} connected players`);
        return roomWithCount;
      })
    );

    console.log(`[SERVER] Returning ${roomsWithPlayerCount.length} rooms for ${gameType}`);
    return roomsWithPlayerCount;
  }

  async createRoom(hostId, roomData) {
    const { bet, gameType, tableType, maxPlayers = 2 } = roomData;

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

    const host = await User.findByPk(hostId);
    if (!host) {
      const error = new Error('Создатель комнаты не найден.');
      error.statusCode = 404;
      throw error;
    }

    if (host.coins < bet) {
      const error = new Error('Insufficient coins.');
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
      players: []
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
    console.log('[SERVER] Running cleanup for orphaned rooms...');
    try {
      const waitingRooms = await GameRoom.findAll({ where: { status: 'waiting' } });
      let deletedCount = 0;

      for (const room of waitingRooms) {
        const sockets = await io.in(room.id).fetchSockets();
        if (sockets.length === 0) {
          await room.destroy();
          console.log(`[SERVER] Deleted orphaned room ${room.id} as it was empty.`);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`[SERVER] Cleanup finished. Deleted ${deletedCount} orphaned rooms.`);
      } else {
        console.log('[SERVER] Cleanup finished. No orphaned rooms found.');
      }
    } catch (error) {
      console.error('[SERVER] [ERROR] in cleanupOrphanedRooms:', error);
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

  async finalizeGame(roomId, winnerUserId, loserUserId) {
    const t = await sequelize.transaction();
    try {
      const room = await GameRoom.findByPk(roomId, { transaction: t });
      if (!room || room.status !== 'in_progress') {
        await t.rollback();
        console.log(`Транзакция отменена: комната ${roomId} не найдена или ее статус не 'in_progress'`);
        return;
      }

      const winner = await User.findByPk(winnerUserId, { transaction: t });
      const loser = await User.findByPk(loserUserId, { transaction: t });

      if (!winner || !loser) {
        await t.rollback();
        return;
      }
      
      winner.coins += room.bet;
      loser.coins -= room.bet;
      
      if (loser.coins < 0) loser.coins = 0;

      await winner.save({ transaction: t });
      await loser.save({ transaction: t });
      
      // Изменяем статус на 'finished' вместо удаления комнаты
      room.status = 'finished';
      await room.save({ transaction: t });

      await t.commit();
      console.log(`Игра ${roomId} завершена. Победитель ${winner.id} получил ${room.bet} монет.`);
      return { winner, loser };

    } catch (error) {
      await t.rollback();
      console.error(`!!! Ошибка в finalizeGame для комнаты ${roomId}:`, error);
      return null;
    }
  }
}

module.exports = new GameService();