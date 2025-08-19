const express = require('express');
const router = express.Router();
const lessonService = require('../services/lesson.service');
const authenticate = require('../middleware/auth.middleware');
const { Op } = require('sequelize');

// Middleware для аутентификации на всех routes
router.use(authenticate);

/**
 * GET /api/lessons/daily
 * Получить урок дня для текущего пользователя
 */
router.get('/daily', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Сброс streak если нужно
    await lessonService.resetStreakIfNeeded(userId);
    
    const dailyLesson = await lessonService.getTodaysLesson(userId);
    
    res.json({
      success: true,
      data: dailyLesson
    });
  } catch (error) {
    console.error('Error getting daily lesson:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get daily lesson'
    });
  }
});

/**
 * POST /api/lessons/:lessonId/complete
 * Отметить урок как выполненный
 */
router.post('/:lessonId/complete', async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;
    const { feedback, completionTime } = req.body;
    
    const result = await lessonService.completeLesson(userId, lessonId, {
      userInput: feedback,
      completionTimeSeconds: completionTime,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: {
        progress: result.progress,
        totalReward: result.totalReward,
        newStreak: result.newStreak,
        coinsEarned: result.progress.coins_earned,
        streakBonus: result.progress.streak_bonus
      },
      message: `Урок выполнен! Получено ${result.totalReward} монет.`
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to complete lesson'
    });
  }
});

/**
 * GET /api/lessons/progress
 * Получить прогресс по урокам (для пар или одиночных пользователей)
 */
router.get('/progress', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Сначала ищем партнера через существующую модель Pair
    const { Pair } = require('../models');
    const pair = await Pair.findOne({
      where: {
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: 'active'
      }
    });
    
    if (pair) {
      // Если есть партнер - возвращаем прогресс пары
      const partnerId = pair.user1Id === userId ? pair.user2Id : pair.user1Id;
      const progress = await lessonService.getPairProgress(userId, partnerId);
      
      res.json({
        success: true,
        data: progress
      });
    } else {
      // Если нет партнера - возвращаем персональный прогресс
      const progress = await lessonService.getSingleUserProgress(userId);
      
      res.json({
        success: true,
        data: progress
      });
    }
  } catch (error) {
    console.error('Error getting lesson progress:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get lesson progress'
    });
  }
});

/**
 * GET /api/lessons/history
 * Получить историю выполненных уроков
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, theme } = req.query;
    
    const { UserLessonProgress, Lesson } = require('../models');
    const { Op } = require('sequelize');
    
    const offset = (page - 1) * limit;
    const whereClause = { user_id: userId };
    
    const includeClause = [{
      model: Lesson,
      as: 'Lesson',
      where: theme ? { theme } : undefined
    }];
    
    const history = await UserLessonProgress.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['completed_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    res.json({
      success: true,
      data: {
        lessons: history.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: history.count,
          pages: Math.ceil(history.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting lesson history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get lesson history'
    });
  }
});

/**
 * GET /api/lessons/stats
 * Получить статистику пользователя по урокам
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const { UserLessonProgress } = require('../models');
    
    const stats = await UserLessonProgress.getCompletionStats(userId);
    const streak = await lessonService.getUserLessonStreak(userId);
    
    // Статистика по последним 7 дням
    const weeklyProgress = await UserLessonProgress.getWeeklyProgress(userId, 0);
    
    res.json({
      success: true,
      data: {
        ...stats,
        currentStreak: streak,
        weeklyLessons: weeklyProgress.length,
        lastWeekCompletion: weeklyProgress
      }
    });
  } catch (error) {
    console.error('Error getting lesson stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get lesson stats'
    });
  }
});

/**
 * GET /api/lessons/themes
 * Получить прогресс по темам уроков
 */
router.get('/themes', async (req, res) => {
  try {
    const userId = req.user.id;
    const { UserLessonProgress, Lesson } = require('../models');
    
    const themes = ['words_of_affirmation', 'acts_of_service', 'receiving_gifts', 'quality_time', 'physical_touch'];
    const themeProgress = {};
    
    for (const theme of themes) {
      const progress = await UserLessonProgress.getThemeProgress(userId, theme);
      const totalLessons = await Lesson.count({ where: { theme, is_active: true } });
      
      themeProgress[theme] = {
        completed: progress.length,
        total: totalLessons,
        percentage: totalLessons > 0 ? Math.round((progress.length / totalLessons) * 100) : 0,
        lastCompleted: progress.length > 0 ? progress[progress.length - 1].completed_at : null
      };
    }
    
    res.json({
      success: true,
      data: themeProgress
    });
  } catch (error) {
    console.error('Error getting theme progress:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get theme progress'
    });
  }
});

/**
 * POST /api/lessons/relationship/metrics
 * Обновить метрики отношений (для настройки алгоритма)
 */
router.post('/relationship/metrics', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      love_language_primary, 
      love_language_secondary, 
      attachment_style, 
      relationship_stage 
    } = req.body;
    
    // Найти партнера
    const { Pair } = require('../models');
    const pair = await Pair.findOne({
      where: {
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: 'active'
      }
    });
    
    if (!pair) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }
    
    const partnerId = pair.user1Id === userId ? pair.user2Id : pair.user1Id;
    const relationshipMetrics = await lessonService.getOrCreateRelationshipMetrics(userId, partnerId);
    
    // Обновляем метрики
    const updateData = {};
    if (love_language_primary) updateData.love_language_primary = love_language_primary;
    if (love_language_secondary) updateData.love_language_secondary = love_language_secondary;
    if (attachment_style) updateData.attachment_style = attachment_style;
    if (relationship_stage) updateData.relationship_stage = relationship_stage;
    
    await relationshipMetrics.update(updateData);
    
    res.json({
      success: true,
      data: relationshipMetrics,
      message: 'Метрики отношений обновлены'
    });
  } catch (error) {
    console.error('Error updating relationship metrics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update relationship metrics'
    });
  }
});

/**
 * GET /api/lessons/weekly
 * Получить уроки недели для пары
 */
router.get('/weekly', async (req, res) => {
  try {
    const userId = req.user.id;
    const { weekOffset = 0 } = req.query;
    
    // Найти партнера
    const { Pair } = require('../models');
    const pair = await Pair.findOne({
      where: {
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: 'active'
      }
    });
    
    if (!pair) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }
    
    const partnerId = pair.user1Id === userId ? pair.user2Id : pair.user1Id;
    const relationshipMetrics = await lessonService.getOrCreateRelationshipMetrics(userId, partnerId);
    
    const { PairDailyLesson } = require('../models');
    const weeklyLessons = await PairDailyLesson.getWeeklyLessons(relationshipMetrics.id, parseInt(weekOffset));
    
    res.json({
      success: true,
      data: weeklyLessons
    });
  } catch (error) {
    console.error('Error getting weekly lessons:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get weekly lessons'
    });
  }
});

module.exports = router;
