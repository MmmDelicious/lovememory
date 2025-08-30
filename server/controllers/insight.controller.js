const { Insight, Pair } = require('../models');
const insightGeneratorService = require('../services/insight.generator.service');

/**
 * Получить инсайты для пары
 */
exports.getInsightsForPair = async (req, res, next) => {
  try {
    const { pairId } = req.params;
    const { type, limit = 10, unread_after } = req.query;
    
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
    
    let insights;
    
    if (unread_after) {
      // Получаем только новые инсайты после указанной даты
      insights = await Insight.getUnread(pairId, unread_after);
    } else if (type) {
      // Получаем инсайты определенного типа
      insights = await Insight.getByType(pairId, type, parseInt(limit));
    } else {
      // Получаем последние инсайты
      insights = await Insight.getLatestForPair(pairId, parseInt(limit));
    }
    
    res.status(200).json(insights);
  } catch (error) {
    next(error);
  }
};

/**
 * Генерировать новые инсайты для пары
 */
exports.generateInsights = async (req, res, next) => {
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
    
    // Генерируем новые инсайты
    const newInsights = await insightGeneratorService.generateInsightsForPair(pairId);
    
    res.status(200).json({
      generated_count: newInsights.length,
      insights: newInsights
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Получить статистику инсайтов для пары
 */
exports.getInsightStats = async (req, res, next) => {
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
    
    // Получаем статистику по типам инсайтов
    const stats = await Insight.findAll({
      where: { pair_id: pairId },
      attributes: [
        'insight_type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['insight_type'],
      raw: true
    });
    
    // Получаем общее количество
    const totalCount = await Insight.count({ where: { pair_id: pairId } });
    
    // Получаем количество за последние 7 дней
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = await Insight.count({
      where: {
        pair_id: pairId,
        generated_at: { [require('sequelize').Op.gte]: weekAgo }
      }
    });
    
    const response = {
      total_insights: totalCount,
      recent_insights: recentCount,
      insights_by_type: stats.reduce((acc, stat) => {
        acc[stat.insight_type] = parseInt(stat.count);
        return acc;
      }, {}),
      last_generated: await Insight.findOne({
        where: { pair_id: pairId },
        order: [['generated_at', 'DESC']],
        attributes: ['generated_at']
      })?.generated_at || null
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Удалить инсайт
 */
exports.deleteInsight = async (req, res, next) => {
  try {
    const { insightId } = req.params;
    
    // Находим инсайт
    const insight = await Insight.findByPk(insightId, {
      include: [{ model: Pair, as: 'Pair' }]
    });
    
    if (!insight) {
      const error = new Error('Insight not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Проверяем права доступа
    if (insight.Pair.user1Id !== req.user.id && insight.Pair.user2Id !== req.user.id) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }
    
    await insight.destroy();
    
    res.status(200).json({ message: 'Insight deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Получить рекомендации на основе инсайтов
 */
exports.getInsightRecommendations = async (req, res, next) => {
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
    
    // Получаем последние рекомендации
    const recommendationInsights = await Insight.findAll({
      where: {
        pair_id: pairId,
        insight_type: 'recommendation'
      },
      order: [['generated_at', 'DESC']],
      limit: 5
    });
    
    // Форматируем рекомендации для удобного использования
    const recommendations = recommendationInsights.map(insight => ({
      id: insight.id,
      title: insight.summary,
      details: insight.details,
      generated_at: insight.generated_at,
      actionable: true // Можно создать событие на основе этой рекомендации
    }));
    
    res.status(200).json(recommendations);
  } catch (error) {
    next(error);
  }
};
