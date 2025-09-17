const { Interest, UserInterest, User } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');
const clickhouseService = require('../services/clickhouse.service');
const mlService = require('../services/ml.service');

/**
 * Получить все доступные интересы
 */
exports.getAllInterests = async (req, res, next) => {
  try {
    const { category, search, limit = 100 } = req.query;
    
    const where = { is_active: true };
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.name = {
        [require('sequelize').Op.iLike]: `%${search}%`
      };
    }
    
    const interests = await Interest.findAll({
      where,
      attributes: ['id', 'name', 'category', 'description', 'emoji', 'is_active', 'popularity_score'],
      order: [['popularity_score', 'DESC'], ['name', 'ASC']],
      limit: parseInt(limit)
    });
    
    res.status(200).json(interests);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить интересы по категориям
 */
exports.getInterestsByCategory = async (req, res, next) => {
  try {
    const interests = await Interest.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'category', 'description', 'emoji', 'is_active', 'popularity_score'],
      order: [['category', 'ASC'], ['popularity_score', 'DESC'], ['name', 'ASC']]
    });
    
    // Группируем по категориям
    const groupedInterests = interests.reduce((acc, interest) => {
      if (!acc[interest.category]) {
        acc[interest.category] = [];
      }
      acc[interest.category].push(interest);
      return acc;
    }, {});
    
    res.status(200).json(groupedInterests);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить популярные интересы
 */
exports.getPopularInterests = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    
    const interests = await Interest.getPopular(parseInt(limit));
    res.status(200).json(interests);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить интересы пользователя (гибридный запрос)
 */
exports.getUserInterests = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { preference, source = 'postgresql' } = req.query;
    
    // Проверяем права доступа (пользователь может смотреть только свои интересы)
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    let userInterests;

    if (source === 'clickhouse') {
      try {
        // Получаем из ClickHouse (быстрее для аналитики)
        const chPreferences = await clickhouseService.getUserPreferences(userId);
        
        // Джойним с данными интересов из PostgreSQL
        const interestIds = chPreferences.map(p => p.interest_id);
        if (interestIds.length > 0) {
          const interests = await Interest.findAll({
            where: { id: interestIds, is_active: true }
          });
          
          userInterests = chPreferences.map(pref => {
            const interest = interests.find(i => i.id === pref.interest_id);
            return {
              ...pref,
              Interest: interest,
              preference: pref.current_rating > 7 ? 'love' : 
                         pref.current_rating > 4 ? 'like' : 'neutral',
              intensity: pref.current_rating
            };
          });
        } else {
          userInterests = [];
        }
        
      } catch (chError) {
        console.warn('ClickHouse query failed, falling back to PostgreSQL:', chError);
        userInterests = await UserInterest.getForUser(userId, preference);
      }
      
    } else {
      // Получаем из PostgreSQL (надежнее)
      userInterests = await UserInterest.getForUser(userId, preference);
    }
    
    res.status(200).json(userInterests);
  } catch (error) {
    next(error);
  }
};

/**
 * Добавить/обновить интерес пользователя (с ClickHouse интеграцией)
 */
exports.setUserInterest = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { interest_id, preference, intensity, metadata } = req.body;
    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    // Валидация
    if (!interest_id || !preference) {
      const error = new ValidationError('interest_id and preference are required');
      throw error;
    }
    
    // Проверяем существование интереса
    const interest = await Interest.findByPk(interest_id);
    if (!interest || !interest.is_active) {
      const error = new NotFoundError('Interest not found');
      throw error;
    }
    
    // Получаем текущий интерес (если есть) для логирования изменений
    const existingInterest = await UserInterest.findOne({
      where: { user_id: userId, interest_id }
    });
    
    const oldIntensity = existingInterest ? existingInterest.intensity : null;
    const newIntensity = intensity || 5;
    
    // DUAL WRITE: PostgreSQL + ClickHouse
    try {
      // 1. Обновляем PostgreSQL
      const [userInterest, created] = await UserInterest.upsert({
        user_id: userId,
        interest_id,
        preference,
        intensity: newIntensity,
        metadata: metadata || {},
        added_at: created ? new Date() : undefined
      });

      // 2. Логируем в ClickHouse
      await clickhouseService.logInterestEvent({
        userId,
        interestId: interest_id,
        eventType: created ? 'select' : 'rate',
        oldRating: oldIntensity,
        newRating: newIntensity,
        sessionId: req.sessionID || 'unknown',
        source: 'profile',
        metadata: { preference, ...metadata }
      });

      // 3. Увеличиваем популярность в PostgreSQL
      if (created && (preference === 'love' || preference === 'like')) {
        await Interest.incrementPopularity(interest_id);
      }

      // 4. Получаем полную информацию
      const fullUserInterest = await UserInterest.findOne({
        where: { user_id: userId, interest_id },
        include: [{ model: Interest, as: 'Interest' }]
      });

      // 5. Асинхронно обновляем эмбеддинг пользователя
      mlService.updateUserEmbeddingRealtime(userId).catch(mlError => {
        console.error('❌ Failed to update user embedding:', mlError);
      });

      res.status(created ? 201 : 200).json(fullUserInterest);
      
    } catch (dualWriteError) {
      console.error('❌ Dual write failed:', dualWriteError);
      
      // Fallback: хотя бы PostgreSQL должен работать
      const [userInterest, created] = await UserInterest.upsert({
        user_id: userId,
        interest_id,
        preference,
        intensity: newIntensity,
        metadata: metadata || {}
      });

      res.status(created ? 201 : 200).json({ 
        ...userInterest.toJSON(),
        warning: 'Analytics logging failed' 
      });
    }
    
  } catch (error) {
    next(error);
  }
};

/**
 * Массовое добавление интересов пользователя (для онбординга с ClickHouse)
 */
exports.setMultipleUserInterests = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { interests } = req.body; // [{ interest_id, preference, intensity }]
    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    // Проверяем существование пользователя
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new NotFoundError('User not found');
      throw error;
    }
    
    if (!Array.isArray(interests) || interests.length === 0) {
      const error = new ValidationError('interests array is required');
      throw error;
    }
    
    const results = [];
    const interestIds = [];
    const clickhouseEvents = [];
    
    for (const interestData of interests) {
      const { interest_id, preference, intensity } = interestData;
      
      // Валидация каждого интереса
      if (!interest_id || !preference) {
        continue; // Пропускаем некорректные данные
      }
      
      // Проверяем существование интереса
      const interest = await Interest.findByPk(interest_id);
      if (!interest || !interest.is_active) {
        continue; // Пропускаем несуществующие интересы
      }
      
      const [userInterest, created] = await UserInterest.upsert({
        user_id: userId,
        interest_id,
        preference,
        intensity: intensity || 5,
        metadata: {}
      });

      results.push(userInterest);
      
      // Подготавливаем событие для ClickHouse
      clickhouseEvents.push({
        userId,
        interestId: interest_id,
        eventType: created ? 'select' : 'rate',
        oldRating: null,
        newRating: intensity || 5,
        sessionId: req.sessionID || 'onboarding',
        source: 'onboarding',
        metadata: { preference, batch: true }
      });
      
      // Увеличиваем популярность интереса
      if (created && (preference === 'love' || preference === 'like')) {
        interestIds.push(interest_id);
      }
    }
    
    // DUAL WRITE: логируем в ClickHouse batch'ом
    try {
      if (clickhouseEvents.length > 0) {
        await clickhouseService.batchLogInterestEvents(clickhouseEvents);
      }
    } catch (chError) {
      console.error('❌ ClickHouse batch logging failed:', chError);
      // Продолжаем выполнение, так как PostgreSQL уже обновлен
    }
    
    // Массово увеличиваем популярность
    for (const interestId of interestIds) {
      await Interest.incrementPopularity(interestId);
    }
    
    // Получаем полную информацию о добавленных интересах
    const fullUserInterests = await UserInterest.findAll({
      where: { 
        user_id: userId,
        interest_id: results.map(r => r.interest_id)
      },
      include: [{
        model: Interest,
        as: 'Interest'
      }]
    });

    // Асинхронно обновляем эмбеддинг пользователя после batch операции
    mlService.updateUserEmbeddingRealtime(userId).catch(mlError => {
      console.error('❌ Failed to update user embedding after batch:', mlError);
    });

    res.status(201).json(fullUserInterests);
  } catch (error) {
    next(error);
  }
};

/**
 * Удалить интерес пользователя (с логированием в ClickHouse)
 */
exports.removeUserInterest = async (req, res, next) => {
  try {
    const { userId, interestId } = req.params;
    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    // Получаем текущий интерес перед удалением
    const existingInterest = await UserInterest.findOne({
      where: { user_id: userId, interest_id: interestId }
    });
    
    const deleted = await UserInterest.destroy({
      where: {
        user_id: userId,
        interest_id: interestId
      }
    });
    
    if (deleted === 0) {
      const error = new NotFoundError('User interest not found');
      throw error;
    }
    
    // Логируем удаление в ClickHouse
    try {
      if (existingInterest) {
        await clickhouseService.logInterestEvent({
          userId,
          interestId,
          eventType: 'deselect',
          oldRating: existingInterest.intensity,
          newRating: null,
          sessionId: req.sessionID || 'unknown',
          source: 'profile',
          metadata: { 
            removed: true,
            previous_preference: existingInterest.preference 
          }
        });
      }
    } catch (chError) {
      console.error('❌ ClickHouse logging failed for interest removal:', chError);
      // Продолжаем выполнение, так как удаление из PostgreSQL уже выполнено
    }
    
    res.status(200).json({ message: 'Interest removed successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Найти общие интересы между пользователями в паре
 */
exports.getCommonInterests = async (req, res, next) => {
  try {
    const { userId1, userId2 } = req.params;
    
    // Проверяем права доступа (пользователь должен быть одним из участников)
    if (userId1 !== req.user.id && userId2 !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    const commonInterests = await UserInterest.findCommonInterests(userId1, userId2);
    res.status(200).json(commonInterests);
  } catch (error) {
    next(error);
  }
};

/**
 * Обновить активность интереса (когда пользователь взаимодействует с интересом)
 */
exports.updateInterestActivity = async (req, res, next) => {
  try {
    const { userId, interestId } = req.params;
    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    await UserInterest.updateActivity(userId, interestId);
    
    // Логируем активность в ClickHouse
    try {
      await clickhouseService.logInterestEvent({
        userId,
        interestId,
        eventType: 'view',
        sessionId: req.sessionID || 'unknown',
        source: 'interaction',
        metadata: { activity_update: true }
      });
    } catch (chError) {
      console.error('❌ ClickHouse activity logging failed:', chError);
    }
    
    res.status(200).json({ message: 'Activity updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Получить статистику интересов пользователя из ClickHouse
 */
exports.getUserInterestsAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    const [stats, activity, history] = await Promise.all([
      clickhouseService.getUserStats(userId),
      clickhouseService.getUserActivityAnalytics(userId),
      clickhouseService.getUserInterestHistory(userId, null, 50)
    ]);
    
    res.status(200).json({
      stats,
      activity,
      recent_history: history
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Получить топ интересы с аналитикой
 */
exports.getTopInterestsAnalytics = async (req, res, next) => {
  try {
    const { limit = 50, days = 30 } = req.query;
    
    const topInterests = await clickhouseService.getTopInterests(
      parseInt(limit), 
      parseInt(days)
    );
    
    // Получаем детали интересов из PostgreSQL
    const interestIds = topInterests.map(t => t.interest_id);
    const interestDetails = await Interest.findAll({
      where: { id: interestIds, is_active: true },
      attributes: ['id', 'name', 'category', 'description', 'emoji']
    });
    
    // Комбинируем данные
    const enrichedTopInterests = topInterests.map(interest => {
      const details = interestDetails.find(d => d.id === interest.interest_id);
      return {
        ...interest,
        ...details?.toJSON()
      };
    });
    
    res.status(200).json(enrichedTopInterests);
    
  } catch (error) {
    next(error);
  }
};

/**
 * Найти похожих пользователей по интересам
 */
exports.findSimilarUsers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    const similarUsers = await clickhouseService.findSimilarUsers(
      userId, 
      parseInt(limit)
    );
    
    res.status(200).json(similarUsers);
    
  } catch (error) {
    next(error);
  }
};

/**
 * Получить рекомендации интересов для пользователя
 */
exports.getInterestRecommendations = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    const recommendations = await mlService.recommendInterests(
      userId, 
      parseInt(limit)
    );
    
    // Получаем детали рекомендованных интересов
    if (recommendations.length > 0) {
      const interestIds = recommendations.map(r => r.interest_id);
      const interests = await Interest.findAll({
        where: { id: interestIds, is_active: true },
        attributes: ['id', 'name', 'category', 'description', 'emoji']
      });
      
      const enrichedRecommendations = recommendations.map(rec => {
        const interest = interests.find(i => i.id === rec.interest_id);
        return {
          ...rec,
          Interest: interest
        };
      });
      
      res.status(200).json(enrichedRecommendations);
    } else {
      res.status(200).json([]);
    }
    
  } catch (error) {
    next(error);
  }
};

/**
 * Обновить эмбеддинг пользователя вручную
 */
exports.updateUserEmbedding = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    const embedding = await mlService.updateUserEmbeddingRealtime(userId);
    
    if (embedding) {
      res.status(200).json({ 
        message: 'Embedding updated successfully',
        embedding_size: embedding.length
      });
    } else {
      res.status(200).json({ 
        message: 'No preferences found, embedding not generated' 
      });
    }
    
  } catch (error) {
    next(error);
  }
};

/**
 * Вычислить совместимость между пользователями
 */
exports.calculateUserCompatibility = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { targetUserId } = req.body;
    
    // Проверяем права доступа
    if (userId !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    if (!targetUserId) {
      const error = new ValidationError('targetUserId is required');
      throw error;
    }
    
    const similarity = await mlService.calculateUserSimilarity(userId, targetUserId);
    
    if (similarity) {
      res.status(200).json({
        user1_id: userId,
        user2_id: targetUserId,
        compatibility_score: similarity.similarity,
        compatibility_percentage: Math.round(similarity.similarity * 100),
        model_versions: {
          user1: similarity.user1_model,
          user2: similarity.user2_model
        },
        calculated_at: similarity.calculated_at
      });
    } else {
      res.status(200).json({
        user1_id: userId,
        user2_id: targetUserId,
        compatibility_score: null,
        message: 'Unable to calculate compatibility (insufficient data)'
      });
    }
    
  } catch (error) {
    next(error);
  }
};
