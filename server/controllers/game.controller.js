const { GameRoom, User, sequelize } = require('../models');

class GameController {
  async getRooms(req, res) {
    const { gameType } = req.query;
    if (!gameType) {
      return res.status(400).json({ message: 'gameType query parameter is required.' });
    }
    try {
      const rooms = await GameRoom.findAll({
        where: { gameType, status: 'waiting' },
        include: {
          model: User,
          as: 'Host',
          attributes: ['id', 'first_name']
        },
        order: [['createdAt', 'DESC']]
      });
      res.status(200).json(rooms);
    } catch (error) {
      console.error('!!! Ошибка в getRooms:', error);
      res.status(500).json({ message: 'Failed to get rooms', error: error.message });
    }
  }

  async createRoom(req, res) {
    const { bet, gameType, tableType } = req.body;
    
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Пользователь не аутентифицирован.' });
    }
    const hostId = req.user.id;

    if (!bet || bet <= 0) {
      return res.status(400).json({ message: 'Bet must be a positive number.' });
    }
    if (!gameType) {
      return res.status(400).json({ message: 'gameType is required.' });
    }

    try {
      const host = await User.findByPk(hostId);

      if (!host) {
        return res.status(404).json({ message: 'Создатель комнаты не найден.' });
      }

      if (host.coins < bet) {
        return res.status(400).json({ message: 'Insufficient coins.' });
      }

      // Для покера определяем блайнды на основе типа стола
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
      
      const newRoom = await GameRoom.create({
        hostId,
        bet,
        gameType,
        tableType: gameType === 'poker' ? tableType : null,
        blinds: gameType === 'poker' ? blinds : null,
        status: 'waiting',
        players: [hostId]
      });

      res.status(201).json(newRoom);
    } catch (error)
    {
      console.error('!!! Ошибка в createRoom:', error);
      res.status(500).json({ message: 'Failed to create room', error: error.message });
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

      // Обновляем баланс монет для каждого победителя
      for (const winnerInfo of winnersInfo) {
        const winner = await User.findByPk(winnerInfo.player.id, { transaction: t });
        if (winner) {
          // Конвертируем выигранные фишки в монеты (10 фишек = 1 монета)
          const coinsWon = Math.floor(winnerInfo.pot / 10);
          winner.coins += coinsWon;
          await winner.save({ transaction: t });
          console.log(`[SERVER] Player ${winner.id} won ${coinsWon} coins from pot`);
        }
      }
      
      // Сохраняем рейк в системный пул (можно расширить в будущем)
      if (rakeInCoins > 0) {
        console.log(`[SERVER] Collected rake: ${rakeInCoins} coins`);
        // TODO: Implement rake storage in system pool
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

module.exports = new GameController();