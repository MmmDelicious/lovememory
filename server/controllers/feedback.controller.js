const { RecommendationFeedback, User, Pair } = require('../models');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Создать новый отзыв на рекомендацию
 */
exports.createFeedback = async (req, res, next) => {
  try {
    const {
      pair_id,
      entity_type,
      entity_id,
      entity_data,
      value,
      comment,
      recommendation_context,
      feedback_type,
      recommendation_date,
      visit_date,
      tags
    } = req.body;
    
    // Валидация обязательных полей
    if (!pair_id || !entity_type || !entity_id || !value) {
      const error = new ValidationError('pair_id, entity_type, entity_id, and value are required');
      throw error;
    }
    
    // Проверяем, что пользователь принадлежит к паре
    const pair = await Pair.findByPk(pair_id);
    if (!pair) {
      const error = new NotFoundError('Pair not found');
      throw error;
    }
    
    // Проверяем права доступа (пользователь должен быть в паре)
    if (pair.user1_id !== req.user.id && pair.user2_id !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    // Создаем фидбэк
    const feedback = await RecommendationFeedback.createFeedback({
      user_id: req.user.id,
      pair_id,
      entity_type,
      entity_id,
      entity_data: entity_data || {},
      value,
      comment,
      recommendation_context: recommendation_context || {},
      feedback_type: feedback_type || 'rating',
      recommendation_date,
      visit_date,
      tags: tags || []
    });
    
    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить фидбэк для пары
 */
exports.getFeedbackForPair = async (req, res, next) => {
  try {
    const { pairId } = req.params;
    const { entity_type, limit = 50, page = 1 } = req.query;
    
    // Проверяем права доступа к паре
    const pair = await Pair.findByPk(pairId);
    if (!pair) {
      const error = new NotFoundError('Pair not found');
      throw error;
    }
    
    if (pair.user1_id !== req.user.id && pair.user2_id !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const feedback = await RecommendationFeedback.findAll({
      where: {
        pair_id: pairId,
        ...(entity_type && { entity_type })
      },
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'first_name', 'display_name', 'avatarUrl']
      }],
      order: [['submitted_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.status(200).json(feedback);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить статистику фидбэка для пары
 */
exports.getFeedbackStats = async (req, res, next) => {
  try {
    const { pairId } = req.params;
    const { entity_type } = req.query;
    
    // Проверяем права доступа к паре
    const pair = await Pair.findByPk(pairId);
    if (!pair) {
      const error = new NotFoundError('Pair not found');
      throw error;
    }
    
    if (pair.user1_id !== req.user.id && pair.user2_id !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    let stats;
    if (entity_type) {
      stats = await RecommendationFeedback.getStatsByType(pairId, entity_type);
    } else {
      // Получаем статистику по всем типам
      const entityTypes = ['place', 'activity', 'event', 'insight', 'date_idea', 'gift', 'lesson', 'game'];
      stats = {};
      
      for (const type of entityTypes) {
        stats[type] = await RecommendationFeedback.getStatsByType(pairId, type);
      }
    }
    
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить среднюю оценку для конкретной сущности
 */
exports.getAverageRating = async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.params;
    
    const averageRating = await RecommendationFeedback.getAverageRating(entity_type, entity_id);
    
    res.status(200).json({ 
      entity_type,
      entity_id,
      average_rating: averageRating 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Обновить существующий фидбэк
 */
exports.updateFeedback = async (req, res, next) => {
  try {
    const { feedbackId } = req.params;
    const updateData = req.body;
    
    // Находим фидбэк
    const feedback = await RecommendationFeedback.findByPk(feedbackId);
    if (!feedback) {
      const error = new NotFoundError('Feedback not found');
      throw error;
    }
    
    // Проверяем права доступа (только автор может изменять)
    if (feedback.user_id !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    // Обновляем фидбэк
    await feedback.update(updateData);
    
    res.status(200).json(feedback);
  } catch (error) {
    next(error);
  }
};

/**
 * Удалить фидбэк
 */
exports.deleteFeedback = async (req, res, next) => {
  try {
    const { feedbackId } = req.params;
    
    // Находим фидбэк
    const feedback = await RecommendationFeedback.findByPk(feedbackId);
    if (!feedback) {
      const error = new NotFoundError('Feedback not found');
      throw error;
    }
    
    // Проверяем права доступа (только автор может удалять)
    if (feedback.user_id !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    await feedback.destroy();
    
    res.status(200).json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Получить фидбэк пользователя
 */
exports.getUserFeedback = async (req, res, next) => {
  try {
    const { limit = 50, page = 1, entity_type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = { user_id: req.user.id };
    if (entity_type) {
      where.entity_type = entity_type;
    }
    
    const feedback = await RecommendationFeedback.findAll({
      where,
      include: [{
        model: Pair,
        as: 'Pair',
        attributes: ['id', 'name']
      }],
      order: [['submitted_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.status(200).json(feedback);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить фидбэк, ожидающий ответа (для уведомлений)
 */
exports.getPendingFeedback = async (req, res, next) => {
  try {
    const { pairId } = req.params;
    
    // Проверяем права доступа к паре
    const pair = await Pair.findByPk(pairId);
    if (!pair) {
      const error = new NotFoundError('Pair not found');
      throw error;
    }
    
    if (pair.user1_id !== req.user.id && pair.user2_id !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    // Находим рекомендации старше 1 дня без фидбэка
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // Это упрощенная логика - в реальности нужно проверять конкретные рекомендации
    // Здесь мы просто возвращаем заглушку для демонстрации структуры
    const pendingFeedback = {
      pair_id: pairId,
      pending_count: 0,
      recommendations: []
    };
    
    res.status(200).json(pendingFeedback);
  } catch (error) {
    next(error);
  }
};
