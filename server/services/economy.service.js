/**
 * @fileoverview Сервис для управления игровой экономикой
 * Единая система ставок для всех игр в приложении
 */

const { User, GameRoom, sequelize } = require('../models');

/**
 * Типы игр для экономической системы
 */
const GAME_TYPES = {
  STANDARD: 'standard', // Обычные игры с фиксированной ставкой
  POKER: 'poker'        // Покер с системой стеков
};

/**
 * Статусы экономических транзакций
 */
const TRANSACTION_STATUS = {
  PENDING: 'pending',     // Ставка сделана, игра не началась
  ACTIVE: 'active',       // Игра началась, ставки заблокированы
  COMPLETED: 'completed', // Игра завершена, призы выданы
  CANCELLED: 'cancelled'  // Игра отменена, ставки возвращены
};

class EconomyService {
  /**
   * Определяет тип экономической системы для игры
   * @param {string} gameType - Тип игры
   * @returns {string} Тип экономической системы
   */
  getEconomyType(gameType) {
    return gameType === 'poker' ? GAME_TYPES.POKER : GAME_TYPES.STANDARD;
  }

  /**
   * Проверяет, может ли игрок сделать ставку
   * @param {string} userId - ID игрока
   * @param {number} betAmount - Размер ставки
   * @returns {Promise<{canBet: boolean, reason?: string}>}
   */
  async canPlayerBet(userId, betAmount) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return { canBet: false, reason: 'Пользователь не найден' };
      }

      if (user.coins < betAmount) {
        return { canBet: false, reason: `Недостаточно монет. У вас: ${user.coins}, требуется: ${betAmount}` };
      }

      if (betAmount <= 0) {
        return { canBet: false, reason: 'Ставка должна быть положительной' };
      }

      return { canBet: true };
    } catch (error) {
      console.error('Ошибка проверки возможности ставки:', error);
      return { canBet: false, reason: 'Ошибка проверки баланса' };
    }
  }

  /**
   * Резервирует монеты игрока при входе в комнату (для стандартных игр)
   * @param {string} userId - ID игрока
   * @param {string} roomId - ID комнаты
   * @param {number} betAmount - Размер ставки
   * @returns {Promise<{success: boolean, newBalance?: number, reason?: string}>}
   */
  async reservePlayerBet(userId, roomId, betAmount) {
    const transaction = await sequelize.transaction();
    try {
      // Проверяем возможность ставки
      const canBet = await this.canPlayerBet(userId, betAmount);
      if (!canBet.canBet) {
        await transaction.rollback();
        return { success: false, reason: canBet.reason };
      }

      // Списываем монеты
      const user = await User.findByPk(userId, { transaction });
      user.coins -= betAmount;
      await user.save({ transaction });

      await transaction.commit();
      console.log(`[ECONOMY] Зарезервирована ставка ${betAmount} монет для игрока ${userId} в комнате ${roomId}`);
      
      return { 
        success: true, 
        newBalance: user.coins 
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Ошибка резервирования ставки:', error);
      return { success: false, reason: 'Ошибка обработки ставки' };
    }
  }

  /**
   * Возвращает зарезервированные монеты игроку (при выходе из комнаты до начала игры)
   * @param {string} userId - ID игрока
   * @param {number} betAmount - Размер возвращаемой ставки
   * @returns {Promise<{success: boolean, newBalance?: number, reason?: string}>}
   */
  async refundPlayerBet(userId, betAmount) {
    const transaction = await sequelize.transaction();
    try {
      const user = await User.findByPk(userId, { transaction });
      if (!user) {
        await transaction.rollback();
        return { success: false, reason: 'Пользователь не найден' };
      }

      user.coins += betAmount;
      await user.save({ transaction });

      await transaction.commit();
      console.log(`[ECONOMY] Возвращена ставка ${betAmount} монет игроку ${userId}`);
      
      return { 
        success: true, 
        newBalance: user.coins 
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Ошибка возврата ставки:', error);
      return { success: false, reason: 'Ошибка возврата ставки' };
    }
  }

  /**
   * Завершает игру и распределяет призы (для стандартных игр)
   * @param {string} roomId - ID комнаты
   * @param {string|null} winnerId - ID победителя (null для ничьей)
   * @param {string[]} playerIds - Список всех игроков
   * @param {boolean} isDraw - Ничья ли это
   * @returns {Promise<{success: boolean, results?: object, reason?: string}>}
   */
  async finalizeStandardGame(roomId, winnerId, playerIds, isDraw = false) {
    const transaction = await sequelize.transaction();
    try {
      const room = await GameRoom.findByPk(roomId, { transaction });
      if (!room) {
        await transaction.rollback();
        return { success: false, reason: 'Комната не найдена' };
      }

      const betAmount = room.bet;
      const totalPrize = betAmount * playerIds.length;

      const results = {
        totalPrize,
        betAmount,
        playerResults: {},
        isDraw
      };

      if (isDraw) {
        // При ничьей возвращаем ставки всем игрокам
        for (const playerId of playerIds) {
          const user = await User.findByPk(playerId, { transaction });
          if (user) {
            user.coins += betAmount;
            await user.save({ transaction });
            results.playerResults[playerId] = {
              type: 'draw',
              coinsChange: betAmount,
              newBalance: user.coins
            };
          }
        }
        console.log(`[ECONOMY] Ничья в комнате ${roomId}, ставки возвращены всем игрокам`);
      } else if (winnerId) {
        // Победитель получает всю сумму
        const winner = await User.findByPk(winnerId, { transaction });
        if (!winner) {
          await transaction.rollback();
          return { success: false, reason: 'Победитель не найден' };
        }

        winner.coins += totalPrize;
        await winner.save({ transaction });

        results.playerResults[winnerId] = {
          type: 'winner',
          coinsChange: totalPrize,
          newBalance: winner.coins
        };

        // Остальные игроки получают информацию о поражении
        for (const playerId of playerIds) {
          if (playerId !== winnerId) {
            const loser = await User.findByPk(playerId, { transaction });
            if (loser) {
              results.playerResults[playerId] = {
                type: 'loser',
                coinsChange: -betAmount,
                newBalance: loser.coins
              };
            }
          }
        }

        console.log(`[ECONOMY] Игра ${roomId} завершена. Победитель ${winnerId} получил ${totalPrize} монет`);
      }

      // Обновляем статус комнаты
      room.status = 'finished';
      await room.save({ transaction });

      await transaction.commit();
      return { success: true, results };
    } catch (error) {
      await transaction.rollback();
      console.error('Ошибка завершения стандартной игры:', error);
      return { success: false, reason: 'Ошибка завершения игры' };
    }
  }

  /**
   * Обрабатывает досрочный выход игрока из игры
   * @param {string} roomId - ID комнаты
   * @param {string} leavingPlayerId - ID покидающего игрока
   * @param {string[]} remainingPlayerIds - ID остающихся игроков
   * @returns {Promise<{success: boolean, results?: object, reason?: string}>}
   */
  async handlePlayerLeave(roomId, leavingPlayerId, remainingPlayerIds) {
    try {
      const room = await GameRoom.findByPk(roomId);
      if (!room) {
        return { success: false, reason: 'Комната не найдена' };
      }

      const economyType = this.getEconomyType(room.gameType);

      if (economyType === GAME_TYPES.STANDARD) {
        // Для стандартных игр: выход = поражение
        if (remainingPlayerIds.length === 1) {
          // Остался один игрок - он побеждает
          const winnerId = remainingPlayerIds[0];
          const allPlayers = [leavingPlayerId, winnerId];
          return await this.finalizeStandardGame(roomId, winnerId, allPlayers, false);
        } else if (remainingPlayerIds.length > 1) {
          // Остается несколько игроков - игра продолжается
          console.log(`[ECONOMY] Игрок ${leavingPlayerId} покинул игру ${roomId}, игра продолжается`);
          return { 
            success: true, 
            results: { 
              gameStatus: 'continues',
              leavingPlayer: leavingPlayerId,
              remainingPlayers: remainingPlayerIds
            } 
          };
        }
      } else if (economyType === GAME_TYPES.POKER) {
        // Для покера обрабатывается в PokerGame
        console.log(`[ECONOMY] Игрок ${leavingPlayerId} покинул покер ${roomId}`);
        return { success: true, results: { gameType: 'poker', handled: 'by_poker_game' } };
      }

      return { success: false, reason: 'Неизвестный тип игры' };
    } catch (error) {
      console.error('Ошибка обработки выхода игрока:', error);
      return { success: false, reason: 'Ошибка обработки выхода' };
    }
  }

  /**
   * Отменяет игру и возвращает ставки всем игрокам
   * @param {string} roomId - ID комнаты
   * @param {string[]} playerIds - ID всех игроков
   * @returns {Promise<{success: boolean, reason?: string}>}
   */
  async cancelGame(roomId, playerIds) {
    const transaction = await sequelize.transaction();
    try {
      const room = await GameRoom.findByPk(roomId, { transaction });
      if (!room) {
        await transaction.rollback();
        return { success: false, reason: 'Комната не найдена' };
      }

      const economyType = this.getEconomyType(room.gameType);

      if (economyType === GAME_TYPES.STANDARD) {
        // Возвращаем ставки всем игрокам
        const betAmount = room.bet;
        for (const playerId of playerIds) {
          const refundResult = await this.refundPlayerBet(playerId, betAmount);
          if (!refundResult.success) {
            console.error(`Ошибка возврата ставки игроку ${playerId}:`, refundResult.reason);
          }
        }
      }

      // Обновляем статус комнаты
      room.status = 'cancelled';
      await room.save({ transaction });

      await transaction.commit();
      console.log(`[ECONOMY] Игра ${roomId} отменена, ставки возвращены`);
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      console.error('Ошибка отмены игры:', error);
      return { success: false, reason: 'Ошибка отмены игры' };
    }
  }

  /**
   * Получает информацию о балансе игрока
   * @param {string} userId - ID игрока
   * @returns {Promise<{balance: number, canPlay: boolean}>}
   */
  async getPlayerBalance(userId) {
    try {
      const user = await User.findByPk(userId, { attributes: ['coins'] });
      if (!user) {
        return { balance: 0, canPlay: false };
      }

      return {
        balance: user.coins,
        canPlay: user.coins >= 10 // Минимальная ставка 10 монет
      };
    } catch (error) {
      console.error('Ошибка получения баланса:', error);
      return { balance: 0, canPlay: false };
    }
  }

  /**
   * Покерный buy-in - списывает деньги при входе в покер
   * @param {string} userId - ID игрока
   * @param {number} buyInAmount - Сумма buy-in
   * @returns {Promise<{success: boolean, newBalance?: number, reason?: string}>}
   */
  async pokerBuyIn(userId, buyInAmount) {
    const transaction = await sequelize.transaction();
    try {
      // Проверяем возможность buy-in
      const canBet = await this.canPlayerBet(userId, buyInAmount);
      if (!canBet.canBet) {
        await transaction.rollback();
        return { success: false, reason: canBet.reason };
      }

      // Списываем монеты
      const user = await User.findByPk(userId, { transaction });
      user.coins -= buyInAmount;
      await user.save({ transaction });

      await transaction.commit();
      console.log(`[POKER] Buy-in ${buyInAmount} монет для игрока ${userId}`);
      
      return { 
        success: true, 
        newBalance: user.coins 
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Ошибка покерного buy-in:', error);
      return { success: false, reason: 'Ошибка обработки buy-in' };
    }
  }

  /**
   * Покерный cash-out - возвращает деньги при выходе из покера
   * @param {string} userId - ID игрока
   * @param {number} cashOutAmount - Сумма для возврата
   * @returns {Promise<{success: boolean, newBalance?: number, reason?: string}>}
   */
  async pokerCashOut(userId, cashOutAmount) {
    const transaction = await sequelize.transaction();
    try {
      if (cashOutAmount <= 0) {
        await transaction.rollback();
        return { success: false, reason: 'Некорректная сумма для возврата' };
      }

      const user = await User.findByPk(userId, { transaction });
      if (!user) {
        await transaction.rollback();
        return { success: false, reason: 'Пользователь не найден' };
      }

      user.coins += cashOutAmount;
      await user.save({ transaction });

      await transaction.commit();
      console.log(`[POKER] Cash-out ${cashOutAmount} монет игроку ${userId}`);
      
      return { 
        success: true, 
        newBalance: user.coins 
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Ошибка покерного cash-out:', error);
      return { success: false, reason: 'Ошибка возврата средств' };
    }
  }

  /**
   * Покерный rebuy - добавляет деньги к стеку игрока
   * @param {string} userId - ID игрока
   * @param {number} rebuyAmount - Сумма rebuy
   * @returns {Promise<{success: boolean, newBalance?: number, reason?: string}>}
   */
  async pokerRebuy(userId, rebuyAmount) {
    const transaction = await sequelize.transaction();
    try {
      // Проверяем возможность rebuy
      const canBet = await this.canPlayerBet(userId, rebuyAmount);
      if (!canBet.canBet) {
        await transaction.rollback();
        return { success: false, reason: canBet.reason };
      }

      // Списываем монеты
      const user = await User.findByPk(userId, { transaction });
      user.coins -= rebuyAmount;
      await user.save({ transaction });

      await transaction.commit();
      console.log(`[POKER] Rebuy ${rebuyAmount} монет для игрока ${userId}`);
      
      return { 
        success: true, 
        newBalance: user.coins 
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Ошибка покерного rebuy:', error);
      return { success: false, reason: 'Ошибка обработки rebuy' };
    }
  }
}

module.exports = new EconomyService();
