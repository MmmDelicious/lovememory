/**
 * Activity Tracker Controller - управление трекером активности
 */

const activityTrackerService = require('../services/activityTracker.service');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * Получить или создать трекер для пользователя
 */
const getOrCreateTracker = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pairId } = req.query;

    const tracker = await activityTrackerService.getOrCreateTracker(userId, pairId);

    res.json({
      success: true,
      data: {
        tracker: {
          id: tracker.id,
          dailySteps: tracker.daily_steps,
          dailyGoal: tracker.daily_goal,
          weeklyGoal: tracker.weekly_goal,
          caloriesBurned: tracker.calories_burned,
          activeMinutes: tracker.active_minutes,
          distance: tracker.distance_km,
          currentStreak: tracker.current_streak,
          longestStreak: tracker.longest_streak,
          totalDaysActive: tracker.total_days_active,
          achievements: tracker.achievements || [],
          lastSync: tracker.last_sync,
          dataSource: tracker.data_source
        }
      }
    });

  } catch (error) {
    console.error('Error in getOrCreateTracker:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get/create tracker',
      error: error.message
    });
  }
};

/**
 * Обновить дневную активность
 */
const updateDailyActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { steps, calories, activeMinutes, distance } = req.body;

    if (!steps && !calories && !activeMinutes && !distance) {
      return res.status(400).json({
        success: false,
        message: 'At least one activity metric is required'
      });
    }

    const result = await activityTrackerService.updateDailyActivity(userId, {
      steps: steps || 0,
      calories: calories || 0,
      activeMinutes: activeMinutes || 0,
      distance: distance || 0
    });

    res.json({
      success: true,
      data: {
        tracker: {
          id: result.tracker.id,
          dailySteps: result.tracker.daily_steps,
          goalProgress: result.goalProgress,
          currentStreak: result.tracker.current_streak
        },
        newAchievements: result.newAchievements,
        message: result.newAchievements.length > 0 
          ? `Got ${result.newAchievements.length} new achievements!`
          : 'Activity updated'
      }
    });

  } catch (error) {
    console.error('Error in updateDailyActivity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity',
      error: error.message
    });
  }
};

/**
 * Получить статистику пользователя
 */
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await activityTrackerService.getUserStats(userId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Activity tracker not found'
      });
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error in getUserStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user stats',
      error: error.message
    });
  }
};

/**
 * Получить статистику пары
 */
const getPairStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pairId } = req.params;

    if (!pairId) {
      return res.status(400).json({
        success: false,
        message: 'Pair ID is required'
      });
    }

    const pairStats = await activityTrackerService.getPairStats(pairId);

    if (!pairStats) {
      return res.status(404).json({
        success: false,
        message: 'Pair stats not found'
      });
    }

    res.json({
      success: true,
      data: pairStats
    });

  } catch (error) {
    console.error('Error in getPairStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pair stats',
      error: error.message
    });
  }
};

/**
 * Обновить цели пользователя
 */
const updateGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dailyGoal, weeklyGoal } = req.body;

    if (!dailyGoal && !weeklyGoal) {
      return res.status(400).json({
        success: false,
        message: 'At least one goal must be provided'
      });
    }

    const tracker = await activityTrackerService.updateGoals(userId, {
      daily: dailyGoal,
      weekly: weeklyGoal
    });

    res.json({
      success: true,
      data: {
        tracker: {
          id: tracker.id,
          dailyGoal: tracker.daily_goal,
          weeklyGoal: tracker.weekly_goal
        },
        message: 'Цели успешно обновлены!'
      }
    });

  } catch (error) {
    console.error('Error in updateGoals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update goals',
      error: error.message
    });
  }
};

/**
 * Синхронизировать данные с внешними источниками
 */
const syncExternalData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { source, steps, calories, activeMinutes, distance } = req.body;

    if (!source) {
      return res.status(400).json({
        success: false,
        message: 'Data source is required'
      });
    }

    const result = await activityTrackerService.syncExternalData(userId, {
      source,
      steps,
      calories,
      activeMinutes,
      distance
    });

    res.json({
      success: true,
      data: {
        tracker: {
          id: result.tracker.id,
          dailySteps: result.tracker.daily_steps,
          goalProgress: result.goalProgress
        },
        newAchievements: result.newAchievements,
        message: 'Данные успешно синхронизированы!'
      }
    });

  } catch (error) {
    console.error('Error in syncExternalData:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync external data',
      error: error.message
    });
  }
};

/**
 * Получить достижения пользователя
 */
const getUserAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await activityTrackerService.getUserStats(userId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Activity tracker not found'
      });
    }

    // Получаем детали достижений
    const achievements = stats.achievements.map(achievementId => {
      const achievementMap = {
        'first_goal': {
          id: 'first_goal',
          title: 'Первые шаги',
          description: 'Достигли первой цели по шагам!',
          icon: '👣',
          unlocked: true
        },
        'consistent_week': {
          id: 'consistent_week',
          title: 'Неделя активности',
          description: '7 дней подряд достигаете цели!',
          icon: '🔥',
          unlocked: true
        },
        'consistent_month': {
          id: 'consistent_month',
          title: 'Месяц активности',
          description: '30 дней подряд! Вы невероятны!',
          icon: '🏆',
          unlocked: true
        },
        'ultra_active': {
          id: 'ultra_active',
          title: 'Ультра активность',
          description: '15,000+ шагов за день!',
          icon: '⚡',
          unlocked: true
        }
      };

      return achievementMap[achievementId] || {
        id: achievementId,
        title: 'Неизвестное достижение',
        description: 'Достижение получено!',
        icon: '🎖️',
        unlocked: true
      };
    });

    res.json({
      success: true,
      data: {
        achievements,
        totalUnlocked: achievements.length,
        totalAvailable: Object.keys(achievementMap).length
      }
    });

  } catch (error) {
    console.error('Error in getUserAchievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements',
      error: error.message
    });
  }
};

/**
 * Получить лидерборд активности
 */
const getActivityLeaderboard = async (req, res) => {
  try {
    const { period = 'week', limit = 10 } = req.query;

    // Здесь можно добавить логику для получения лидерборда
    // Пока возвращаем заглушку
    const leaderboard = [
      {
        rank: 1,
        userId: 'user1',
        name: 'Анна',
        avatar: null,
        steps: 15000,
        streak: 7,
        score: 95
      },
      {
        rank: 2,
        userId: 'user2',
        name: 'Михаил',
        avatar: null,
        steps: 12000,
        streak: 5,
        score: 88
      }
    ];

    res.json({
      success: true,
      data: {
        period,
        leaderboard,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in getActivityLeaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: error.message
    });
  }
};

module.exports = {
  getOrCreateTracker,
  updateDailyActivity,
  getUserStats,
  getPairStats,
  updateGoals,
  syncExternalData,
  getUserAchievements,
  getActivityLeaderboard
};
