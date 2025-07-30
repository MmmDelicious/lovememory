const { GameRoom, User, sequelize } = require('../models');

class GameService {
  async findRooms(gameType) {
    if (!gameType) {
      const error = new Error('gameType query parameter is required.');
      error.statusCode = 400;
      throw error;
    }
    return GameRoom.findAll({
      where: { gameType, status: 'waiting' },
      include: {
        model: User,
        as: 'Host',
        attributes: ['id', 'first_name']
      },
      order: [['createdAt', 'DESC']]
    });
  }

  async createRoom(hostId, roomData) {
    const { bet, gameType, tableType } = roomData;

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
      tableType: gameType === 'poker' ? tableType : null,
      blinds: gameType === 'poker' ? blinds : null,
      status: 'waiting',
      players: [hostId]
    });
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

  async finalizePokerGame(roomId, winnersInfo, rakeInCoins) {
    const t = await sequelize.transaction();
    try {
      const room = await GameRoom.findByPk(roomId, { transaction: t });
      if (!room || room.status !== 'in_progress') {
        await t.rollback();
        console.log(`Транзакция отменена: комната ${roomId} не найдена или ее статус не 'in_progress'`);
        return;
      }

      for (const winnerInfo of winnersInfo) {
        const winner = await User.findByPk(winnerInfo.player.id, { transaction: t });
        if (winner) {
          const coinsWon = Math.floor(winnerInfo.pot / 10);
          winner.coins += coinsWon;
          await winner.save({ transaction: t });
          console.log(`[SERVER] Player ${winner.id} won ${coinsWon} coins from pot`);
        }
      }
      
      if (rakeInCoins > 0) {
        console.log(`[SERVER] Collected rake: ${rakeInCoins} coins`);
      }
      
      room.status = 'finished';
      await room.save({ transaction: t });

      await t.commit();
      console.log(`Покерная игра ${roomId} завершена. Рейк: ${rakeInCoins} монет.`);
      
      return { success: true, rakeCollected: rakeInCoins };

    } catch (error) {
      await t.rollback();
      console.error(`!!! Ошибка в finalizePokerGame для комнаты ${roomId}:`, error);
      return null;
    }
  }
}

module.exports = new GameService();