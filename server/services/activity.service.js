/**
 * Activity Service - автоматическое логирование активности пользователей
 * для аналитики отношений согласно ТЗ
 */

const { ActivityLog, User, Pair } = require('../models');

class ActivityService {
  constructor() {
    this.enabledActions = new Set([
      'lesson_completed',
      'game_played', 
      'event_created',
      'event_attended',
      'gift_sent',
      'memory_created',
      'reaction_given',
      'mood_checkin',
      'quick_task_completed',
      'invite_sent',
      'media_shared',
      'profile_updated',
      'user_login'
    ]);
  }

  /**
   * Автоматически определяет pair_id для пользователя
   */
  async findUserPairId(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: Pair,
          through: { 
            model: require('../models').UserPair,
            where: { accepted: true }
          },
          where: { status: 'active' }
        }]
      });
      
      return user?.Pairs?.[0]?.id || null;
    } catch (error) {
      console.warn('Could not find pair for user:', userId, error.message);
      return null;
    }
  }

  /**
   * Базовый метод логирования
   */
  async logActivity(userId, action, payload = {}, explicitPairId = null) {
    try {
      if (!this.enabledActions.has(action)) {
        console.warn(`Action "${action}" not in enabled list:`, Array.from(this.enabledActions));
        return null;
      }

      const pairId = explicitPairId || await this.findUserPairId(userId);
      
      return await ActivityLog.create({
        pair_id: pairId,
        user_id: userId,
        action,
        payload: {
          ...payload,
          timestamp: new Date().toISOString(),
          user_agent: payload.user_agent || 'unknown'
        }
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      return null;
    }
  }

  // ===== МЕТОДЫ ИЗ ТЗ =====

  /**
   * lesson_completed — payload: {lessonId, topic, duration_min, score}
   */
  async logLessonCompleted(userId, { lessonId, topic, duration_min, score, pairId }) {
    return this.logActivity(userId, 'lesson_completed', {
      lessonId,
      topic,
      duration_min,
      score
    }, pairId);
  }

  /**
   * game_played — {gameType, duration_min, result: 'win'|'lose'|'draw', participants:[ids]}
   */
  async logGamePlayed(userId, { gameType, duration_min, result, participants = [], gameRoomId, pairId }) {
    return this.logActivity(userId, 'game_played', {
      gameType,
      duration_min,
      result,
      participants,
      gameRoomId
    }, pairId);
  }

  /**
   * event_created — {eventId, title, type, scheduled_at, creator_id, participants:[ids]}
   */
  async logEventCreated(userId, { eventId, title, type, scheduled_at, participants = [], pairId }) {
    return this.logActivity(userId, 'event_created', {
      eventId,
      title,
      type,
      scheduled_at,
      creator_id: userId,
      participants
    }, pairId);
  }

  /**
   * event_attended — {eventId, status:'attended'|'missed'|'cancelled'}
   */
  async logEventAttended(userId, { eventId, status, pairId }) {
    return this.logActivity(userId, 'event_attended', {
      eventId,
      status
    }, pairId);
  }

  /**
   * gift_sent — {giftId, giftType, amountCoins}
   */
  async logGiftSent(userId, { giftId, giftType, amountCoins, recipientId, pairId }) {
    return this.logActivity(userId, 'gift_sent', {
      giftId,
      giftType,
      amountCoins,
      recipientId
    }, pairId);
  }

  /**
   * memory_created — {memoryId, media_count, is_shared}
   */
  async logMemoryCreated(userId, { memoryId, media_count, is_shared, eventId, pairId }) {
    return this.logActivity(userId, 'memory_created', {
      memoryId,
      media_count,
      is_shared,
      eventId
    }, pairId);
  }

  /**
   * reaction_given — {targetType:'memory'|'lesson'|'event', reactionType:'heart'|'smile'|'thumbs_up'}
   */
  async logReactionGiven(userId, { targetType, targetId, reactionType, pairId }) {
    return this.logActivity(userId, 'reaction_given', {
      targetType,
      targetId,
      reactionType
    }, pairId);
  }

  /**
   * mood_checkin — {mood:'happy'|'ok'|'stressed'|'sad', intensity:1-5, note}
   */
  async logMoodCheckin(userId, { mood, intensity, note, pairId }) {
    return this.logActivity(userId, 'mood_checkin', {
      mood,
      intensity,
      note
    }, pairId);
  }

  /**
   * quick_task_completed — {taskId, type:'surprise'|'compliment'|'help'}
   */
  async logQuickTaskCompleted(userId, { taskId, type, description, pairId }) {
    return this.logActivity(userId, 'quick_task_completed', {
      taskId,
      type,
      description
    }, pairId);
  }

  /**
   * invite_sent — {type:'lesson'|'event'|'game', target_user_id}
   */
  async logInviteSent(userId, { type, target_user_id, targetId, pairId }) {
    return this.logActivity(userId, 'invite_sent', {
      type,
      target_user_id,
      targetId
    }, pairId);
  }

  /**
   * media_shared — {size_MB, type:'photo'|'video'}
   */
  async logMediaShared(userId, { size_MB, type, mediaId, eventId, pairId }) {
    return this.logActivity(userId, 'media_shared', {
      size_MB,
      type,
      mediaId,
      eventId
    }, pairId);
  }

  /**
   * profile_updated — {field:'bio'|'avatar'}
   */
  async logProfileUpdated(userId, { field, oldValue, newValue, pairId }) {
    return this.logActivity(userId, 'profile_updated', {
      field,
      oldValue,
      newValue
    }, pairId);
  }

  /**
   * user_login — логин пользователя
   */
  async logUserLogin(userId, { pairId }) {
    return this.logActivity(userId, 'user_login', {
      login_time: new Date().toISOString()
    }, pairId);
  }

  // ===== АНАЛИТИЧЕСКИЕ МЕТОДЫ =====

  /**
   * Получить все события пары за период
   */
  async getPairActivities(pairId, startDate, endDate = new Date()) {
    try {
      return await ActivityLog.findAll({
        where: {
          pair_id: pairId,
          created_at: {
            [require('sequelize').Op.between]: [startDate, endDate]
          }
        },
        order: [['created_at', 'DESC']],
        include: [
          { model: User, as: 'User', attributes: ['id', 'first_name', 'display_name'] }
        ]
      });
    } catch (error) {
      console.error('Failed to get pair activities:', error);
      return [];
    }
  }

  /**
   * Получить активности пользователя за период
   */
  async getUserActivities(userId, startDate, endDate = new Date()) {
    try {
      return await ActivityLog.findAll({
        where: {
          user_id: userId,
          created_at: {
            [require('sequelize').Op.between]: [startDate, endDate]
          }
        },
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      console.error('Failed to get user activities:', error);
      return [];
    }
  }

  /**
   * Подсчет активностей по типам
   */
  async getActivityCounts(pairId, startDate, endDate = new Date()) {
    try {
      const activities = await this.getPairActivities(pairId, startDate, endDate);
      
      const counts = activities.reduce((acc, activity) => {
        acc[activity.action] = (acc[activity.action] || 0) + 1;
        return acc;
      }, {});

      return counts;
    } catch (error) {
      console.error('Failed to get activity counts:', error);
      return {};
    }
  }
}

module.exports = new ActivityService();
