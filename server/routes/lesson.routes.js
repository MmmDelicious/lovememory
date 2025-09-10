const express = require('express');
const router = express.Router();
const lessonService = require('../services/lesson.service');
const { authenticateToken } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');

/**
 * GET /api/lessons/daily
 * Get today's lesson for current user
 */
router.get('/daily', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Reset streak if needed
    await lessonService.resetStreakIfNeeded(userId);
    
    const dailyLesson = await lessonService.getTodaysLesson(userId);
    
    res.json({
      success: true,
      data: dailyLesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get daily lesson'
    });
  }
});

/**
 * POST /api/lessons/:lessonId/complete
 * Mark lesson as completed
 */
router.post('/:lessonId/complete', authenticateToken, async (req, res) => {
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
      message: `Lesson completed! Got ${result.totalReward} coins.`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to complete lesson'
    });
  }
});

/**
 * GET /api/lessons/progress
 * Get lesson progress (for pairs or single users)
 */
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First look for partner through existing Pair model
    const { Pair } = require('../models');
    const pair = await Pair.findOne({
      where: {
        [Op.or]: [
          { user1_id: userId },
          { user2_id: userId }
        ],
        status: 'active'
      }
    });
    
    if (pair) {
      // If there's a partner - return pair progress
      const partnerId = pair.user1_id === userId ? pair.user2_id : pair.user1_id;
      const progress = await lessonService.getPairProgress(userId, partnerId);
      
      res.json({
        success: true,
        data: progress
      });
    } else {
      // If no partner - return personal progress
      const progress = await lessonService.getSingleUserProgress(userId);
      
      res.json({
        success: true,
        data: progress
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get lesson progress'
    });
  }
});

/**
 * GET /api/lessons/history
 * Get completed lessons history
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
      where: theme ? { theme } : undefined,
      attributes: ['id', 'title', 'text', 'source', 'tags', 'triggers', 'effect', 'theme', 'interactive_type', 'difficulty_level', 'required_streak', 'animation_file', 'base_coins_reward', 'is_active']
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
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get lesson history'
    });
  }
});

/**
 * GET /api/lessons/stats
 * Get user lesson statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const { UserLessonProgress } = require('../models');
    
    const stats = await UserLessonProgress.getCompletionStats(userId);
    const streak = await lessonService.getUserLessonStreak(userId);
    
    // Statistics for last 7 days
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
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get lesson stats'
    });
  }
});

/**
 * GET /api/lessons/themes
 * Get lesson themes progress
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
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get theme progress'
    });
  }
});

/**
 * POST /api/lessons/relationship/metrics
 * Update relationship metrics (for algorithm tuning)
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
    
    // Find partner
    const { Pair } = require('../models');
    const pair = await Pair.findOne({
      where: {
        [Op.or]: [
          { user1_id: userId },
          { user2_id: userId }
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
    
    const partnerId = pair.user1_id === userId ? pair.user2_id : pair.user1_id;
    const relationshipMetrics = await lessonService.getOrCreateRelationshipMetrics(userId, partnerId);
    
    // Update metrics
    const updateData = {};
    if (love_language_primary) updateData.love_language_primary = love_language_primary;
    if (love_language_secondary) updateData.love_language_secondary = love_language_secondary;
    if (attachment_style) updateData.attachment_style = attachment_style;
    if (relationship_stage) updateData.relationship_stage = relationship_stage;
    
    await relationshipMetrics.update(updateData);
    
    res.json({
      success: true,
      data: relationshipMetrics,
      message: 'Relationship metrics updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update relationship metrics'
    });
  }
});

/**
 * GET /api/lessons/weekly
 * Get weekly lessons for pair
 */
router.get('/weekly', async (req, res) => {
  try {
    const userId = req.user.id;
    const { weekOffset = 0 } = req.query;
    
    // Find partner
    const { Pair } = require('../models');
    const pair = await Pair.findOne({
      where: {
        [Op.or]: [
          { user1_id: userId },
          { user2_id: userId }
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
    
    const partnerId = pair.user1_id === userId ? pair.user2_id : pair.user1_id;
    const relationshipMetrics = await lessonService.getOrCreateRelationshipMetrics(userId, partnerId);
    
    const { PairDailyLesson } = require('../models');
    const weeklyLessons = await PairDailyLesson.getWeeklyLessons(relationshipMetrics.id, parseInt(weekOffset));
    
    res.json({
      success: true,
      data: weeklyLessons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get weekly lessons'
    });
  }
});

module.exports = router;
