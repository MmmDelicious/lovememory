const { Session, User, Pair } = require('../models');
const { Op } = require('sequelize');

class SessionController {
  // Стартовать новую сессию
  async startSession(req, res, next) {
    try {
      const createdByUserId = req.user.id;
      const sessionData = req.body;

      // Проверяем, что пользователь имеет доступ к этой паре
      if (sessionData.pair_id) {
        const pair = await Pair.findByPk(sessionData.pair_id);
        if (!pair) {
          return res.status(404).json({ error: 'Pair not found' });
        }
        
        // Проверяем, что пользователь является частью пары
        // Это можно доработать через UserPair если нужно
        if (pair.user1_id !== createdByUserId && pair.user2_id !== createdByUserId) {
          return res.status(403).json({ error: 'Access denied to this pair' });
        }
      }

      const session = await Session.startSession(
        sessionData.pair_id, 
        createdByUserId, 
        sessionData
      );

      res.status(201).json({
        data: session,
        message: 'Session started successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Получить активные сессии
  async getActiveSessions(req, res, next) {
    try {
      const { pair_id } = req.query;
      const userId = req.user.id;

      // Если указана пара, проверяем доступ
      if (pair_id) {
        const pair = await Pair.findByPk(pair_id);
        if (!pair || (pair.user1_id !== userId && pair.user2_id !== userId)) {
          return res.status(403).json({ error: 'Access denied to this pair' });
        }
      }

      const sessions = await Session.getActiveSessions(pair_id || null);
      
      // Фильтруем сессии для пользователя
      const filteredSessions = sessions.filter(session => {
        if (!session.Pair) return false;
        return session.Pair.user1_id === userId || session.Pair.user2_id === userId;
      });

      res.status(200).json({ data: filteredSessions });
    } catch (error) {
      next(error);
    }
  }

  // Получить сессии для пары
  async getSessionsForPair(req, res, next) {
    try {
      const { pairId } = req.params;
      const userId = req.user.id;
      const filters = req.query;

      // Проверяем доступ к паре
      const pair = await Pair.findByPk(pairId);
      if (!pair || (pair.user1_id !== userId && pair.user2_id !== userId)) {
        return res.status(403).json({ error: 'Access denied to this pair' });
      }

      const sessions = await Session.getSessionsForPair(pairId, filters);
      res.status(200).json({ data: sessions });
    } catch (error) {
      next(error);
    }
  }

  // Получить сессию по ID
  async getSessionById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const session = await Session.findByPk(id, {
        include: [
          {
            model: Pair,
            as: 'Pair'
          },
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'display_name', 'first_name']
          }
        ]
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Проверяем доступ
      if (!session.Pair || 
          (session.Pair.user1_id !== userId && session.Pair.user2_id !== userId)) {
        return res.status(403).json({ error: 'Access denied to this session' });
      }

      res.status(200).json({ 
        data: session,
        canModify: session.created_by_user_id === userId || 
                   session.participants.includes(userId)
      });
    } catch (error) {
      next(error);
    }
  }

  // Поставить сессию на паузу
  async pauseSession(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const session = await Session.findByPk(id, {
        include: [{ model: Pair, as: 'Pair' }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Проверяем доступ
      if (!session.Pair || 
          (session.Pair.user1_id !== userId && session.Pair.user2_id !== userId)) {
        return res.status(403).json({ error: 'Access denied to this session' });
      }

      await session.pause();
      res.status(200).json({ message: 'Session paused successfully' });
    } catch (error) {
      if (error.message.includes('Can only pause')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Возобновить сессию
  async resumeSession(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const session = await Session.findByPk(id, {
        include: [{ model: Pair, as: 'Pair' }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Проверяем доступ
      if (!session.Pair || 
          (session.Pair.user1_id !== userId && session.Pair.user2_id !== userId)) {
        return res.status(403).json({ error: 'Access denied to this session' });
      }

      await session.resume();
      res.status(200).json({ message: 'Session resumed successfully' });
    } catch (error) {
      if (error.message.includes('Can only resume')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Завершить сессию
  async completeSession(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const completionData = req.body;

      const session = await Session.findByPk(id, {
        include: [{ model: Pair, as: 'Pair' }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Проверяем доступ
      if (!session.Pair || 
          (session.Pair.user1_id !== userId && session.Pair.user2_id !== userId)) {
        return res.status(403).json({ error: 'Access denied to this session' });
      }

      await session.complete(completionData);
      res.status(200).json({ message: 'Session completed successfully' });
    } catch (error) {
      if (error.message.includes('Can only complete')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Отменить сессию
  async cancelSession(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { reason } = req.body;

      const session = await Session.findByPk(id, {
        include: [{ model: Pair, as: 'Pair' }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Проверяем доступ
      if (!session.Pair || 
          (session.Pair.user1_id !== userId && session.Pair.user2_id !== userId)) {
        return res.status(403).json({ error: 'Access denied to this session' });
      }

      await session.cancel(reason);
      res.status(200).json({ message: 'Session cancelled successfully' });
    } catch (error) {
      if (error.message.includes('Cannot cancel')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Добавить цель к сессии
  async addGoalToSession(req, res, next) {
    try {
      const { id } = req.params;
      const { goal } = req.body;
      const userId = req.user.id;

      const session = await Session.findByPk(id, {
        include: [{ model: Pair, as: 'Pair' }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Проверяем доступ
      if (!session.Pair || 
          (session.Pair.user1_id !== userId && session.Pair.user2_id !== userId)) {
        return res.status(403).json({ error: 'Access denied to this session' });
      }

      await session.addGoal(goal);
      res.status(200).json({ message: 'Goal added successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Добавить достижение к сессии
  async addAchievementToSession(req, res, next) {
    try {
      const { id } = req.params;
      const { achievement } = req.body;
      const userId = req.user.id;

      const session = await Session.findByPk(id, {
        include: [{ model: Pair, as: 'Pair' }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Проверяем доступ
      if (!session.Pair || 
          (session.Pair.user1_id !== userId && session.Pair.user2_id !== userId)) {
        return res.status(403).json({ error: 'Access denied to this session' });
      }

      await session.addAchievement(achievement);
      res.status(200).json({ message: 'Achievement added successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Обновить прогресс сессии
  async updateSessionProgress(req, res, next) {
    try {
      const { id } = req.params;
      const progressData = req.body;
      const userId = req.user.id;

      const session = await Session.findByPk(id, {
        include: [{ model: Pair, as: 'Pair' }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Проверяем доступ
      if (!session.Pair || 
          (session.Pair.user1_id !== userId && session.Pair.user2_id !== userId)) {
        return res.status(403).json({ error: 'Access denied to this session' });
      }

      await session.updateProgress(progressData);
      res.status(200).json({ message: 'Progress updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Получить статистику сессий для пары
  async getSessionStats(req, res, next) {
    try {
      const { pairId } = req.params;
      const { timeframe = 'month' } = req.query;
      const userId = req.user.id;

      // Проверяем доступ к паре
      const pair = await Pair.findByPk(pairId);
      if (!pair || (pair.user1_id !== userId && pair.user2_id !== userId)) {
        return res.status(403).json({ error: 'Access denied to this pair' });
      }

      const stats = await Session.getSessionStats(pairId, timeframe);
      res.status(200).json({ data: stats });
    } catch (error) {
      next(error);
    }
  }

  // Получить мои созданные сессии
  async getMySessions(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const sessions = await Session.findAll({
        where: { created_by_user_id: userId },
        include: [
          {
            model: Pair,
            as: 'Pair',
            attributes: ['id', 'name']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(200).json({ data: sessions });
    } catch (error) {
      next(error);
    }
  }

  // Обновить сессию
  async updateSession(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const session = await Session.findByPk(id, {
        include: [{ model: Pair, as: 'Pair' }]
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Проверяем доступ
      if (!session.Pair || 
          (session.Pair.user1_id !== userId && session.Pair.user2_id !== userId)) {
        return res.status(403).json({ error: 'Access denied to this session' });
      }

      // Ограничиваем поля для обновления
      const allowedFields = ['title', 'description', 'notes', 'metadata'];
      const filteredData = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      await session.update(filteredData);
      res.status(200).json({ 
        data: session,
        message: 'Session updated successfully' 
      });
    } catch (error) {
      next(error);
    }
  }

  // Получить популярные типы сессий
  async getPopularSessionTypes(req, res, next) {
    try {
      const { pair_id } = req.query;
      const userId = req.user.id;

      let whereClause = { status: 'completed' };
      
      if (pair_id) {
        // Проверяем доступ к паре
        const pair = await Pair.findByPk(pair_id);
        if (!pair || (pair.user1_id !== userId && pair.user2_id !== userId)) {
          return res.status(403).json({ error: 'Access denied to this pair' });
        }
        whereClause.pair_id = pair_id;
      } else {
        // Получаем статистику для всех пар пользователя
        const userPairs = await Pair.findAll({
          where: {
            [Op.or]: [
              { user1_id: userId },
              { user2_id: userId }
            ]
          },
          attributes: ['id']
        });
        
        whereClause.pair_id = { [Op.in]: userPairs.map(p => p.id) };
      }

      const sessions = await Session.findAll({
        where: whereClause,
        attributes: ['session_type', 'quality_rating'],
        order: [['created_at', 'DESC']],
        limit: 1000 // Ограничиваем для производительности
      });

      // Группируем по типам
      const typeStats = {};
      sessions.forEach(session => {
        const type = session.session_type;
        if (!typeStats[type]) {
          typeStats[type] = { count: 0, avgRating: 0, ratings: [] };
        }
        typeStats[type].count++;
        if (session.quality_rating) {
          typeStats[type].ratings.push(session.quality_rating);
        }
      });

      // Вычисляем средние рейтинги и сортируем
      const popularTypes = Object.entries(typeStats)
        .map(([type, stats]) => ({
          type,
          count: stats.count,
          avgRating: stats.ratings.length > 0 
            ? (stats.ratings.reduce((sum, r) => sum + r, 0) / stats.ratings.length).toFixed(1)
            : null
        }))
        .sort((a, b) => b.count - a.count);

      res.status(200).json({ data: popularTypes });
    } catch (error) {
      next(error);
    }
  }

  // Получить сессии по дате
  async getSessionsByDate(req, res, next) {
    try {
      const { pairId } = req.params;
      const { date } = req.query;
      const userId = req.user.id;

      // Проверяем доступ к паре
      const pair = await Pair.findByPk(pairId);
      if (!pair || (pair.user1_id !== userId && pair.user2_id !== userId)) {
        return res.status(403).json({ error: 'Access denied to this pair' });
      }

      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const sessions = await Session.findAll({
        where: {
          pair_id: pairId,
          started_at: {
            [Op.gte]: targetDate,
            [Op.lt]: nextDate
          }
        },
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'display_name', 'first_name']
          }
        ],
        order: [['started_at', 'ASC']]
      });

      res.status(200).json({ data: sessions });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SessionController();
