const { Op } = require('sequelize');
const { 
  RelationshipMetrics, 
  Lesson, 
  UserLessonProgress, 
  PairDailyLesson, 
  User 
} = require('../models');

class LessonService {
  
  /**
   * Алгоритм подбора ежедневного урока для пары
   */
  async selectDailyLesson(userId, partnerId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // 1. Получаем метрики отношений пары
      const relationshipMetrics = await this.getOrCreateRelationshipMetrics(userId, partnerId);
      
      // 2. Проверяем, не назначен ли уже урок на этот день
      const existingLesson = await PairDailyLesson.getTodaysLesson(relationshipMetrics.id, targetDate);
      if (existingLesson) {
        return existingLesson;
      }
      
      // 3. Собираем данные для алгоритма
      const userStreak = await this.getUserLessonStreak(userId);
      const partnerStreak = await this.getUserLessonStreak(partnerId);
      const avgStreak = (userStreak + partnerStreak) / 2;
      
      const gapDays = await this.getGapDaysSinceLastActivity(relationshipMetrics);
      
      // 4. Получаем подходящие уроки
      const candidateLessons = await this.getCandidateLessons(relationshipMetrics, avgStreak);
      
      // 5. Фильтруем по триггерам
      const filteredLessons = candidateLessons.filter(lesson => 
        lesson.checkTriggers(relationshipMetrics, avgStreak, gapDays)
      );
      
      if (filteredLessons.length === 0) {
        // Fallback: случайный урок из primary language
        return await this.getFallbackLesson(relationshipMetrics, targetDate);
      }
      
      // 6. Вычисляем скоры и выбираем лучший
      const scoredLessons = filteredLessons.map(lesson => ({
        lesson,
        score: lesson.calculateMatchScore(relationshipMetrics, avgStreak, gapDays)
      }));
      
      // Сортируем по скору и добавляем немного рандомности
      scoredLessons.sort((a, b) => b.score - a.score);
      
      // Выбираем из топ-3 с элементом случайности
      const topLessons = scoredLessons.slice(0, Math.min(3, scoredLessons.length));
      const selectedIndex = Math.floor(Math.random() * topLessons.length);
      const selectedLesson = topLessons[selectedIndex];
      
      // 7. Сохраняем назначение урока
      const dailyLesson = await PairDailyLesson.create({
        relationship_id: relationshipMetrics.id,
        date: targetDate,
        lesson_id: selectedLesson.lesson.id,
        selection_algorithm_version: 'v1.0',
        selection_score: selectedLesson.score,
        selection_metadata: {
          candidatesCount: candidateLessons.length,
          filteredCount: filteredLessons.length,
          userStreak,
          partnerStreak,
          gapDays,
          heatScore: relationshipMetrics.heat_score
        }
      });
      
      // Загружаем полную информацию
      return await PairDailyLesson.findByPk(dailyLesson.id, {
        include: [
          { model: Lesson, as: 'Lesson' },
          { model: RelationshipMetrics, as: 'Relationship' }
        ]
      });
      
    } catch (error) {
      console.error('Error in selectDailyLesson:', error);
      throw new Error('Failed to select daily lesson');
    }
  }
  
  /**
   * Отмечает урок как выполненный пользователем
   */
  async completeLesson(userId, lessonId, feedback = null) {
    try {
      // 1. Проверяем, есть ли метрики отношений (в паре ли пользователь)
      const relationshipMetrics = await RelationshipMetrics.findOne({
        where: {
          [Op.or]: [
            { user_id: userId },
            { partner_id: userId }
          ]
        }
      });
      
      // 2. Находим урок
      const lesson = await Lesson.findByPk(lessonId);
      if (!lesson) {
        throw new Error('Lesson not found');
      }
      
      // 3. Проверяем, не выполнен ли уже урок
      const today = new Date().toISOString().split('T')[0];
      const existingProgress = await UserLessonProgress.findOne({
        where: {
          user_id: userId,
          lesson_id: lessonId,
          completed_at: {
            [Op.gte]: new Date(today)
          }
        }
      });
      
      if (existingProgress) {
        throw new Error('Lesson already completed today');
      }
      
      // 4. Вычисляем награду
      const currentStreak = await this.getUserLessonStreak(userId);
      const streakBonus = this.calculateStreakBonus(currentStreak + 1);
      const totalCoins = lesson.base_coins_reward + streakBonus;
      
      const partnerId = relationshipMetrics ? 
        (relationshipMetrics.user_id === userId ? relationshipMetrics.partner_id : relationshipMetrics.user_id) : 
        null;
      
      // 5. Сохраняем прогресс
      const progress = await UserLessonProgress.create({
        user_id: userId,
        lesson_id: lessonId,
        completed_at: new Date(),
        coins_earned: lesson.base_coins_reward,
        streak_bonus: streakBonus,
        feedback: feedback,
        partner_id: partnerId // null для одиночных пользователей
      });
      
      // 6. Обновляем монеты пользователя и streak
      await this.updateUserCoinsAndStreak(userId, totalCoins);
      
      // 7. Если пользователь в паре - применяем эффекты к метрикам отношений
      if (relationshipMetrics) {
        lesson.applyEffects(relationshipMetrics);
        await relationshipMetrics.save();
        
        // 8. Отмечаем в ежедневных уроках пары
        const dailyLesson = await PairDailyLesson.findOne({
          where: {
            relationship_id: relationshipMetrics.id,
            lesson_id: lessonId,
            date: today
          }
        });
        
        if (dailyLesson) {
          await dailyLesson.markCompleted(userId, relationshipMetrics);
          
          // WebSocket уведомление партнера о выполнении урока
          if (global.io) {
            const lessonRoom = `lesson:${relationshipMetrics.id}`;
            global.io.to(lessonRoom).emit('lesson:partner-completed', {
              lessonId: lessonId,
              userId: userId,
              progress: {
                coins_earned: lesson.base_coins_reward,
                streak_bonus: streakBonus,
                total_reward: totalCoins,
                new_streak: currentStreak + 1
              },
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
      return {
        progress,
        totalReward: totalCoins,
        newStreak: currentStreak + 1,
        lesson,
        relationshipMetrics: relationshipMetrics || null
      };
      
    } catch (error) {
      console.error('Error in completeLesson:', error);
      throw error;
    }
  }
  
  /**
   * Получает или создает метрики отношений для пары
   */
  async getOrCreateRelationshipMetrics(userId, partnerId) {
    let metrics = await RelationshipMetrics.findOne({
      where: {
        [Op.or]: [
          { user_id: userId, partner_id: partnerId },
          { user_id: partnerId, partner_id: userId }
        ]
      }
    });
    
    if (!metrics) {
      metrics = await RelationshipMetrics.create({
        user_id: userId,
        partner_id: partnerId,
        scores: {
          words: 0,
          acts: 0,
          gifts: 0,
          time: 0,
          touch: 0
        },
        heat_score: 50.0,
        relationship_stage: 'new'
      });
    }
    
    return metrics;
  }
  
  /**
   * Получает streak пользователя по урокам
   */
  async getUserLessonStreak(userId) {
    return await UserLessonProgress.getUserStreak(userId);
  }
  
  /**
   * Получает количество дней с последней активности пары
   */
  async getGapDaysSinceLastActivity(relationshipMetrics) {
    if (!relationshipMetrics.last_activity_date) {
      return 0;
    }
    
    const now = new Date();
    const lastActivity = new Date(relationshipMetrics.last_activity_date);
    const diffTime = Math.abs(now - lastActivity);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Получает кандидатов на урок
   */
  async getCandidateLessons(relationshipMetrics, userStreak) {
    return await Lesson.findAll({
      where: {
        is_active: true,
        required_streak: { [Op.lte]: userStreak }
      }
    });
  }
  
  /**
   * Fallback урок если основной алгоритм не сработал
   */
  async getFallbackLesson(relationshipMetrics, date) {
    const primaryLanguage = relationshipMetrics.love_language_primary || 'words';
    
    const fallbackLesson = await Lesson.findOne({
      where: {
        theme: { [Op.iLike]: `%${primaryLanguage}%` },
        is_active: true
      },
      order: [['id', 'ASC']]
    });
    
    if (!fallbackLesson) {
      // Совсем последний fallback
      const anyLesson = await Lesson.findOne({
        where: { is_active: true },
        order: [['id', 'ASC']]
      });
      
      if (anyLesson) {
        return await PairDailyLesson.create({
          relationship_id: relationshipMetrics.id,
          date: date,
          lesson_id: anyLesson.id,
          selection_algorithm_version: 'v1.0-fallback',
          selection_score: 0,
          selection_metadata: { fallback: 'any_lesson' }
        });
      }
      
      throw new Error('No lessons available');
    }
    
    return await PairDailyLesson.create({
      relationship_id: relationshipMetrics.id,
      date: date,
      lesson_id: fallbackLesson.id,
      selection_algorithm_version: 'v1.0-fallback',
      selection_score: 0,
      selection_metadata: { fallback: primaryLanguage }
    });
  }
  
  /**
   * Вычисляет бонус за streak
   */
  calculateStreakBonus(streakDays) {
    if (streakDays <= 1) return 0;
    
    // +5 за каждый день streak, максимум +50 на 10+ дней
    const bonus = Math.min(50, (streakDays - 1) * 5);
    return bonus;
  }
  
  /**
   * Обновляет монеты и streak пользователя
   */
  async updateUserCoinsAndStreak(userId, coinsToAdd) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentStreak = await this.getUserLessonStreak(userId);
    const today = new Date().toISOString().split('T')[0];
    
    await user.update({
      coins: user.coins + coinsToAdd,
      lesson_streak_days: currentStreak + 1,
      last_lesson_date: today,
      total_lessons_completed: user.total_lessons_completed + 1
    });
    
    return user;
  }
  
  /**
   * Получает прогресс пары по урокам
   */
  async getPairProgress(userId, partnerId) {
    const relationshipMetrics = await this.getOrCreateRelationshipMetrics(userId, partnerId);
    
    // Статистика по парным урокам
    const pairStats = await PairDailyLesson.getProgressStats(relationshipMetrics.id);
    
    // Streak пары
    const pairStreak = await PairDailyLesson.getCompletionStreak(relationshipMetrics.id);
    
    // Индивидуальная статистика
    const userStats = await UserLessonProgress.getCompletionStats(userId);
    const partnerStats = await UserLessonProgress.getCompletionStats(partnerId);
    
    // Прогресс по темам
    const themes = ['words_of_affirmation', 'acts_of_service', 'receiving_gifts', 'quality_time', 'physical_touch'];
    const themeProgress = {};
    
    for (const theme of themes) {
      const userThemeProgress = await UserLessonProgress.getThemeProgress(userId, theme);
      const partnerThemeProgress = await UserLessonProgress.getThemeProgress(partnerId, theme);
      
      themeProgress[theme] = {
        user: userThemeProgress.length,
        partner: partnerThemeProgress.length,
        total: userThemeProgress.length + partnerThemeProgress.length
      };
    }
    
    return {
      pair: {
        ...pairStats,
        streak: pairStreak,
        relationshipMetrics
      },
      user: userStats,
      partner: partnerStats,
      themes: themeProgress
    };
  }
  
  /**
   * Получает урок дня для пользователя
   */
  async getTodaysLesson(userId) {
    try {
      // Сначала проверяем, есть ли у пользователя партнер
      const relationshipMetrics = await RelationshipMetrics.findOne({
        where: {
          [Op.or]: [
            { user_id: userId },
            { partner_id: userId }
          ]
        }
      });
      
      if (relationshipMetrics) {
        // Если пользователь в паре - используем парный алгоритм
        const partnerId = relationshipMetrics.user_id === userId 
          ? relationshipMetrics.partner_id 
          : relationshipMetrics.user_id;
        
        const dailyLesson = await this.selectDailyLesson(userId, partnerId);
        const completionStatus = dailyLesson.getCompletionStatus(userId, relationshipMetrics);
        
        return {
          ...dailyLesson.toJSON(),
          completionStatus
        };
      } else {
        // Если пользователь одиночка - даем персональный урок
        return await this.getSingleUserLesson(userId);
      }
      
    } catch (error) {
      console.error('Error in getTodaysLesson:', error);
      throw error;
    }
  }
  
  /**
   * Получает персональный урок для одиночного пользователя
   */
  async getSingleUserLesson(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Проверяем, не был ли уже назначен урок сегодня
      const existingProgress = await UserLessonProgress.findOne({
        where: {
          user_id: userId,
          completed_at: {
            [Op.gte]: today + ' 00:00:00',
            [Op.lt]: today + ' 23:59:59'
          }
        },
        include: [{ model: Lesson, as: 'Lesson' }]
      });
      
      if (existingProgress) {
        return {
          Lesson: existingProgress.Lesson,
          completionStatus: {
            userCompleted: true,
            partnerCompleted: false, // Нет партнера
            userCompletedAt: existingProgress.completed_at
          },
          date: today,
          relationship_id: null // Одиночный пользователь
        };
      }
      
      // Получаем базовые предпочтения пользователя или используем умолчания
      const user = await User.findByPk(userId);
      const userStreak = await this.getUserLessonStreak(userId);
      
      // Выбираем случайный урок подходящий для начинающих
      const lesson = await Lesson.findOne({
        where: {
          required_streak: { [Op.lte]: userStreak },
          difficulty_level: { [Op.lte]: Math.max(1, Math.floor(userStreak / 3) + 1) } // Прогрессивная сложность
        },
        order: [['id', 'ASC']] // Можно заменить на случайный порядок
      });
      
      if (!lesson) {
        // Fallback - самый простой урок
        const fallbackLesson = await Lesson.findOne({
          where: { difficulty_level: 1 },
          order: [['id', 'ASC']]
        });
        
        if (!fallbackLesson) {
          throw new Error('No lessons available');
        }
        
        return {
          Lesson: fallbackLesson,
          completionStatus: {
            userCompleted: false,
            partnerCompleted: false
          },
          date: today,
          relationship_id: null
        };
      }
      
      return {
        Lesson: lesson,
        completionStatus: {
          userCompleted: false,
          partnerCompleted: false
        },
        date: today,
        relationship_id: null
      };
      
    } catch (error) {
      console.error('Error in getSingleUserLesson:', error);
      throw error;
    }
  }

  /**
   * Получает прогресс одиночного пользователя
   */
  async getSingleUserProgress(userId) {
    try {
      // Получаем статистику пользователя
      const user = await User.findByPk(userId);
      const userStreak = await this.getUserLessonStreak(userId);
      
      // Получаем прогресс по урокам
      const completedLessons = await UserLessonProgress.findAll({
        where: { user_id: userId },
        include: [{ model: Lesson, as: 'Lesson' }]
      });
      
      // Группируем по темам
      const themeProgress = {};
      const themes = ['words_of_affirmation', 'quality_time', 'physical_touch', 'acts_of_service', 'receiving_gifts'];
      
      for (const theme of themes) {
        const themeLessons = await Lesson.findAll({
          where: { theme }
        });
        
        const completed = completedLessons.filter(progress => progress.Lesson.theme === theme);
        
        themeProgress[theme] = {
          completed: completed.length,
          total: themeLessons.length,
          progress: themeLessons.length > 0 ? Math.round((completed.length / themeLessons.length) * 100) : 0,
          last_completed: completed.length > 0 ? 
            completed.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0].completed_at : 
            null
        };
      }
      
      return {
        user: {
          name: user.first_name,
          streak: userStreak,
          total_completed: completedLessons.length,
          coins_earned: completedLessons.reduce((sum, progress) => sum + (progress.coins_earned || 0), 0),
          last_completed: completedLessons.length > 0 ? 
            completedLessons.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0].completed_at : 
            null
        },
        partner: null, // Нет партнера
        themes: themeProgress,
        is_single_user: true
      };
      
    } catch (error) {
      console.error('Error in getSingleUserProgress:', error);
      throw error;
    }
  }

  /**
   * Сброс streak если пользователь пропустил день
   */
  async resetStreakIfNeeded(userId) {
    const user = await User.findByPk(userId);
    if (!user || !user.last_lesson_date) {
      return;
    }
    
    const lastLessonDate = new Date(user.last_lesson_date);
    const today = new Date();
    const daysDiff = Math.floor((today - lastLessonDate) / (1000 * 60 * 60 * 24));
    
    // Если прошло больше 1 дня, сбрасываем streak
    if (daysDiff > 1) {
      await user.update({
        lesson_streak_days: 0
      });
    }
  }
}

module.exports = new LessonService();
