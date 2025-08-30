const { Event, Pair, User, RecommendationFeedback } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Получить статистику по источникам событий для пары
 */
exports.getEventSourceStats = async (req, res, next) => {
  try {
    const { pairId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Проверяем права доступа к паре
    const pair = await Pair.findByPk(pairId);
    if (!pair) {
      const error = new Error('Pair not found');
      error.statusCode = 404;
      throw error;
    }
    
    if (pair.user1Id !== req.user.id && pair.user2Id !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    // Строим условия для фильтрации по дате
    const whereCondition = { pair_id: pairId };
    if (startDate && endDate) {
      whereCondition.event_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereCondition.event_date = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereCondition.event_date = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    // Получаем статистику по источникам
    const sourceStats = await Event.findAll({
      where: whereCondition,
      attributes: [
        'source',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN event_date <= NOW() THEN 1 END')), 'completed_count']
      ],
      group: ['source'],
      raw: true
    });
    
    // Получаем общую статистику
    const totalEvents = await Event.count({ where: whereCondition });
    
    // Получаем статистику по типам событий для AI рекомендаций
    const aiEventTypes = await Event.findAll({
      where: {
        ...whereCondition,
        source: 'AI_SUGGESTED'
      },
      attributes: [
        'event_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['event_type'],
      raw: true
    });
    
    // Формируем ответ
    const stats = {
      total_events: totalEvents,
      source_breakdown: sourceStats.reduce((acc, stat) => {
        acc[stat.source] = {
          count: parseInt(stat.count),
          completed_count: parseInt(stat.completed_count),
          percentage: totalEvents > 0 ? Math.round((stat.count / totalEvents) * 100) : 0
        };
        return acc;
      }, {}),
      ai_event_types: aiEventTypes.reduce((acc, stat) => {
        acc[stat.event_type] = parseInt(stat.count);
        return acc;
      }, {}),
      period: {
        start_date: startDate || null,
        end_date: endDate || null
      }
    };
    
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить конверсию AI рекомендаций в события
 */
exports.getAIConversionStats = async (req, res, next) => {
  try {
    const { pairId } = req.params;
    
    // Проверяем права доступа к паре
    const pair = await Pair.findByPk(pairId);
    if (!pair) {
      const error = new Error('Pair not found');
      error.statusCode = 404;
      throw error;
    }
    
    if (pair.user1Id !== req.user.id && pair.user2Id !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    // Получаем количество AI событий
    const aiEventsCount = await Event.count({
      where: {
        pair_id: pairId,
        source: 'AI_SUGGESTED'
      }
    });
    
    // Получаем рейтинги AI рекомендаций
    const feedbackStats = await RecommendationFeedback.findAll({
      where: {
        pair_id: pairId,
        entity_type: ['place', 'activity', 'date_idea']
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('value')), 'average_rating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_feedback'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN value >= 7 THEN 1 END')), 'positive_feedback'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN feedback_type = \'visited\' THEN 1 END')), 'actually_visited']
      ],
      raw: true
    });
    
    const stats = feedbackStats[0] || {};
    
    // Вычисляем метрики
    const totalFeedback = parseInt(stats.total_feedback) || 0;
    const averageRating = parseFloat(stats.average_rating) || 0;
    const positiveFeedback = parseInt(stats.positive_feedback) || 0;
    const actuallyVisited = parseInt(stats.actually_visited) || 0;
    
    const conversionStats = {
      ai_events_created: aiEventsCount,
      feedback_received: totalFeedback,
      average_rating: Math.round(averageRating * 100) / 100,
      positive_rating_percentage: totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 0,
      visit_conversion_rate: totalFeedback > 0 ? Math.round((actuallyVisited / totalFeedback) * 100) : 0,
      recommendation_effectiveness: {
        high: positiveFeedback,
        total: totalFeedback,
        percentage: totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 0
      }
    };
    
    res.status(200).json(conversionStats);
  } catch (error) {
    next(error);
  }
};

/**
 * Получить детальную статистику по времени
 */
exports.getTimeBasedStats = async (req, res, next) => {
  try {
    const { pairId } = req.params;
    const { period = 'month' } = req.query; // day, week, month, year
    
    // Проверяем права доступа к паре
    const pair = await Pair.findByPk(pairId);
    if (!pair) {
      const error = new Error('Pair not found');
      error.statusCode = 404;
      throw error;
    }
    
    if (pair.user1Id !== req.user.id && pair.user2Id !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    // Определяем формат группировки по времени
    let dateFormat;
    let dateInterval;
    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        dateInterval = 'DAY';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        dateInterval = 'WEEK';
        break;
      case 'year':
        dateFormat = '%Y';
        dateInterval = 'YEAR';
        break;
      default: // month
        dateFormat = '%Y-%m';
        dateInterval = 'MONTH';
    }
    
    // Получаем статистику по времени
    const timeStats = await Event.findAll({
      where: { pair_id: pairId },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('event_date'), dateFormat), 'period'],
        'source',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [
        sequelize.fn('DATE_FORMAT', sequelize.col('event_date'), dateFormat),
        'source'
      ],
      order: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('event_date'), dateFormat), 'ASC']
      ],
      raw: true
    });
    
    // Группируем данные для удобного отображения
    const groupedStats = timeStats.reduce((acc, stat) => {
      const period = stat.period;
      if (!acc[period]) {
        acc[period] = {
          period,
          USER_CREATED: 0,
          AI_SUGGESTED: 0,
          total: 0
        };
      }
      acc[period][stat.source] = parseInt(stat.count);
      acc[period].total += parseInt(stat.count);
      return acc;
    }, {});
    
    res.status(200).json({
      period_type: period,
      data: Object.values(groupedStats)
    });
  } catch (error) {
    next(error);
  }
};
