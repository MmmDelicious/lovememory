/**
 * Activity Tracker Service - управление трекером активности пользователей
 * Интегрируется с системой аналитики отношений
 */

const { ActivityTracker, ActivityLog, User, Pair } = require('../models');
const activityService = require('./activity.service');

class ActivityTrackerService {
  constructor() {
    this.defaultGoals = {
      daily: 10000,
      weekly: 70000,
      monthly: 300000
    };
    
    this.achievementThresholds = {
      firstGoal: 1000,
      consistentWeek: 7,
      consistentMonth: 30,
      marathon: 42195, // 42.195 км
      ultraActive: 15000
    };
  }

  /**
   * Создает или получает трекер для пользователя
   */
  async getOrCreateTracker(userId, pairId = null) {
    try {
      const { tracker, created } = await ActivityTracker.findOrCreateByUserId(userId, pairId);
      
      if (created) {
        // Логируем создание трекера
        await activityService.logActivity(userId, 'tracker_created', {
          tracker_id: tracker.id,
          initial_goals: {
            daily: tracker.daily_goal,
            weekly: tracker.weekly_goal
          }
        });
      }
      
      return tracker;
    } catch (error) {
      console.error('Error getting/creating tracker:', error);
      throw error;
    }
  }

  /**
   * Обновляет дневную активность пользователя
   */
  async updateDailyActivity(userId, activityData) {
    try {
      const tracker = await ActivityTracker.updateDailyActivity(userId, activityData);
      
      if (!tracker) {
        throw new Error('Tracker not found');
      }

      // Логируем обновление активности
      await activityService.logActivity(userId, 'activity_updated', {
        tracker_id: tracker.id,
        steps: activityData.steps,
        calories: activityData.calories,
        active_minutes: activityData.activeMinutes,
        distance: activityData.distance,
        goal_achieved: activityData.steps >= tracker.daily_goal
      });

      // Проверяем достижения
      const newAchievements = await this.checkAchievements(tracker, activityData);
      
      // Обновляем аналитику отношений
      await this.updateRelationshipAnalytics(userId, tracker, activityData);

      return {
        tracker,
        newAchievements,
        goalProgress: Math.round((activityData.steps / tracker.daily_goal) * 100)
      };

    } catch (error) {
      console.error('Error updating daily activity:', error);
      throw error;
    }
  }

  /**
   * Проверяет и выдает достижения
   */
  async checkAchievements(tracker, activityData) {
    const newAchievements = [];
    const currentAchievements = tracker.achievements || [];

    // Первая цель
    if (activityData.steps >= this.achievementThresholds.firstGoal && 
        !currentAchievements.includes('first_goal')) {
      newAchievements.push({
        id: 'first_goal',
        title: 'Первые шаги',
        description: 'Достигли первой цели по шагам!',
        icon: '👣',
        unlockedAt: new Date()
      });
    }

    // Неделя подряд
    if (tracker.current_streak >= this.achievementThresholds.consistentWeek &&
        !currentAchievements.includes('consistent_week')) {
      newAchievements.push({
        id: 'consistent_week',
        title: 'Неделя активности',
        description: '7 дней подряд достигаете цели!',
        icon: '🔥',
        unlockedAt: new Date()
      });
    }

    // Месяц подряд
    if (tracker.current_streak >= this.achievementThresholds.consistentMonth &&
        !currentAchievements.includes('consistent_month')) {
      newAchievements.push({
        id: 'consistent_month',
        title: 'Месяц активности',
        description: '30 дней подряд! Вы невероятны!',
        icon: '🏆',
        unlockedAt: new Date()
      });
    }

    // Ультра активность
    if (activityData.steps >= this.achievementThresholds.ultraActive &&
        !currentAchievements.includes('ultra_active')) {
      newAchievements.push({
        id: 'ultra_active',
        title: 'Ультра активность',
        description: '15,000+ шагов за день!',
        icon: '⚡',
        unlockedAt: new Date()
      });
    }

    // Обновляем достижения в трекере
    if (newAchievements.length > 0) {
      tracker.achievements = [...currentAchievements, ...newAchievements.map(a => a.id)];
      await tracker.save();
      
      // Логируем достижения
      for (const achievement of newAchievements) {
        await activityService.logActivity(tracker.user_id, 'achievement_unlocked', {
          achievement_id: achievement.id,
          achievement_title: achievement.title,
          tracker_id: tracker.id
        });
      }
    }

    return newAchievements;
  }

  /**
   * Обновляет аналитику отношений на основе активности
   */
  async updateRelationshipAnalytics(userId, tracker, activityData) {
    try {
      // Получаем партнера
      const pair = await Pair.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { user1_id: userId },
            { user2_id: userId }
          ],
          status: 'active'
        }
      });

      if (!pair) return;

      // Анализируем активность для отношений
      const activityScore = this.calculateActivityScore(activityData);
      const consistencyBonus = this.calculateConsistencyBonus(tracker);
      
      // Логируем метрики для аналитики
      await activityService.logActivity(userId, 'activity_analytics', {
        pair_id: pair.id,
        activity_score: activityScore,
        consistency_bonus: consistencyBonus,
        total_score: activityScore + consistencyBonus,
        steps: activityData.steps,
        calories: activityData.calories,
        active_minutes: activityData.activeMinutes
      });

    } catch (error) {
      console.error('Error updating relationship analytics:', error);
    }
  }

  /**
   * Рассчитывает оценку активности для отношений
   */
  calculateActivityScore(activityData) {
    let score = 0;
    
    // Базовые баллы за шаги
    if (activityData.steps >= 10000) score += 30;
    else if (activityData.steps >= 8000) score += 25;
    else if (activityData.steps >= 6000) score += 20;
    else if (activityData.steps >= 4000) score += 15;
    else if (activityData.steps >= 2000) score += 10;
    else score += 5;

    // Бонус за активные минуты
    if (activityData.activeMinutes >= 60) score += 20;
    else if (activityData.activeMinutes >= 45) score += 15;
    else if (activityData.activeMinutes >= 30) score += 10;
    else if (activityData.activeMinutes >= 15) score += 5;

    // Бонус за калории
    if (activityData.calories >= 500) score += 15;
    else if (activityData.calories >= 300) score += 10;
    else if (activityData.calories >= 100) score += 5;

    return Math.min(score, 100); // Максимум 100 баллов
  }

  /**
   * Рассчитывает бонус за постоянство
   */
  calculateConsistencyBonus(tracker) {
    let bonus = 0;
    
    // Бонус за текущую серию
    if (tracker.current_streak >= 7) bonus += 20;
    else if (tracker.current_streak >= 3) bonus += 10;
    else if (tracker.current_streak >= 1) bonus += 5;

    // Бонус за общую активность
    if (tracker.total_days_active >= 30) bonus += 15;
    else if (tracker.total_days_active >= 14) bonus += 10;
    else if (tracker.total_days_active >= 7) bonus += 5;

    return Math.min(bonus, 50); // Максимум 50 бонусных баллов
  }

  /**
   * Получает статистику активности пользователя
   */
  async getUserStats(userId) {
    try {
      const tracker = await ActivityTracker.findOne({ where: { user_id: userId } });
      if (!tracker) return null;

      // Получаем историю активности за последние 7 дней
      const weeklyActivity = await ActivityLog.findAll({
        where: {
          user_id: userId,
          action: 'activity_updated',
          created_at: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        order: [['created_at', 'DESC']],
        limit: 7
      });

      // Анализируем тренды
      const trends = this.analyzeTrends(weeklyActivity);
      
      return {
        current: {
          steps: tracker.daily_steps,
          calories: tracker.calories_burned,
          activeMinutes: tracker.active_minutes,
          distance: tracker.distance_km,
          goalProgress: Math.round((tracker.daily_steps / tracker.daily_goal) * 100)
        },
        goals: {
          daily: tracker.daily_goal,
          weekly: tracker.weekly_goal
        },
        streaks: {
          current: tracker.current_streak,
          longest: tracker.longest_streak,
          totalDays: tracker.total_days_active
        },
        achievements: tracker.achievements || [],
        trends,
        weeklyActivity: weeklyActivity.map(log => ({
          date: log.created_at,
          steps: log.payload.steps,
          goalAchieved: log.payload.goal_achieved
        }))
      };

    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Анализирует тренды активности
   */
  analyzeTrends(weeklyActivity) {
    if (weeklyActivity.length < 2) return { trend: 'stable', change: 0 };

    const recent = weeklyActivity[0]?.payload?.steps || 0;
    const previous = weeklyActivity[1]?.payload?.steps || 0;
    
    const change = recent - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;

    let trend = 'stable';
    if (changePercent > 10) trend = 'increasing';
    else if (changePercent < -10) trend = 'decreasing';

    return {
      trend,
      change,
      changePercent: Math.round(changePercent),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }

  /**
   * Получает статистику пары для сравнения
   */
  async getPairStats(pairId) {
    try {
      const trackers = await ActivityTracker.findAll({
        where: { pair_id: pairId },
        include: [{ model: User, as: 'User', attributes: ['id', 'name', 'avatar'] }]
      });

      if (trackers.length === 0) return null;

      const pairStats = {
        totalSteps: trackers.reduce((sum, t) => sum + t.daily_steps, 0),
        averageSteps: Math.round(trackers.reduce((sum, t) => sum + t.daily_steps, 0) / trackers.length),
        totalCalories: trackers.reduce((sum, t) => sum + t.calories_burned, 0),
        totalActiveMinutes: trackers.reduce((sum, t) => sum + t.active_minutes, 0),
        combinedStreak: Math.min(...trackers.map(t => t.current_streak)),
        users: trackers.map(tracker => ({
          id: tracker.User.id,
          name: tracker.User.name,
          avatar: tracker.User.avatar,
          steps: tracker.daily_steps,
          goalProgress: Math.round((tracker.daily_steps / tracker.daily_goal) * 100),
          streak: tracker.current_streak
        }))
      };

      return pairStats;

    } catch (error) {
      console.error('Error getting pair stats:', error);
      throw error;
    }
  }

  /**
   * Обновляет цели пользователя
   */
  async updateGoals(userId, newGoals) {
    try {
      const tracker = await ActivityTracker.findOne({ where: { user_id: userId } });
      if (!tracker) throw new Error('Tracker not found');

      const oldGoals = {
        daily: tracker.daily_goal,
        weekly: tracker.weekly_goal
      };

      // Обновляем цели
      if (newGoals.daily) tracker.daily_goal = newGoals.daily;
      if (newGoals.weekly) tracker.weekly_goal = newGoals.weekly;

      await tracker.save();

      // Логируем изменение целей
      await activityService.logActivity(userId, 'goals_updated', {
        tracker_id: tracker.id,
        old_goals: oldGoals,
        new_goals: {
          daily: tracker.daily_goal,
          weekly: tracker.weekly_goal
        }
      });

      return tracker;

    } catch (error) {
      console.error('Error updating goals:', error);
      throw error;
    }
  }

  /**
   * Синхронизирует данные с внешними источниками
   */
  async syncExternalData(userId, externalData) {
    try {
      const tracker = await ActivityTracker.findOne({ where: { user_id: userId } });
      if (!tracker) throw new Error('Tracker not found');

      // Обновляем источник данных
      tracker.data_source = externalData.source || 'external';
      tracker.last_sync = new Date();

      // Обновляем активность
      const updateResult = await this.updateDailyActivity(userId, {
        steps: externalData.steps || 0,
        calories: externalData.calories || 0,
        activeMinutes: externalData.activeMinutes || 0,
        distance: externalData.distance || 0
      });

      return updateResult;

    } catch (error) {
      console.error('Error syncing external data:', error);
      throw error;
    }
  }
}

module.exports = new ActivityTrackerService();
