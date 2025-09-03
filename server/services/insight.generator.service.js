const { Insight, Event, UserInterest, Interest, Pair, User, ActivityTracker } = require('../models');
const { Op } = require('sequelize');

class InsightGeneratorService {
  
  /**
   * Генерировать инсайты для пары на основе правил
   */
  async generateInsightsForPair(pairId) {
    const insights = [];
    
    try {
      // Получаем данные пары
      const pair = await Pair.findByPk(pairId, {
        include: [
          { model: User, as: 'Requester' },
          { model: User, as: 'Receiver' }
        ]
      });
      
      if (!pair) {
        throw new Error('Pair not found');
      }
      
      // Генерируем разные типы инсайтов
      const compatibilityInsights = await this.generateCompatibilityInsights(pair);
      const activityInsights = await this.generateActivityPatternInsights(pair);
      const recommendationInsights = await this.generateRecommendationInsights(pair);
      
      insights.push(...compatibilityInsights);
      insights.push(...activityInsights);
      insights.push(...recommendationInsights);
      
      // Сохраняем только новые инсайты (избегаем дублирования)
      const savedInsights = [];
      for (const insight of insights) {
        const existing = await this.checkExistingInsight(pairId, insight);
        if (!existing) {
          const saved = await Insight.create({
            pair_id: pairId,
            insight_type: insight.type,
            summary: insight.summary,
            details: insight.details,
            model_version: 'rule_based_v1.0'
          });
          savedInsights.push(saved);
        }
      }
      
      return savedInsights;
      
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }
  
  /**
   * Генерировать инсайты о совместимости на основе общих интересов
   */
  async generateCompatibilityInsights(pair) {
    const insights = [];
    
    try {
      // Получаем интересы обоих пользователей
      const user1Interests = await UserInterest.findAll({
        where: { user_id: pair.user1_id },
        include: [{ model: Interest, as: 'Interest' }]
      });
      
      const user2Interests = await UserInterest.findAll({
        where: { user_id: pair.user2_id },
        include: [{ model: Interest, as: 'Interest' }]
      });
      
      // Находим общие интересы
      const commonInterests = [];
      user1Interests.forEach(u1Interest => {
        const match = user2Interests.find(u2Interest => 
          u2Interest.interest_id === u1Interest.interest_id &&
          u1Interest.preference !== 'dislike' &&
          u2Interest.preference !== 'dislike'
        );
        if (match) {
          commonInterests.push({
            interest: u1Interest.Interest,
            user1_intensity: u1Interest.intensity,
            user2_intensity: match.intensity,
            compatibility_score: Math.min(u1Interest.intensity, match.intensity)
          });
        }
      });
      
      if (commonInterests.length >= 3) {
        const topInterests = commonInterests
          .sort((a, b) => b.compatibility_score - a.compatibility_score)
          .slice(0, 3);
        
        const avgScore = topInterests.reduce((sum, i) => sum + i.compatibility_score, 0) / topInterests.length;
        
        insights.push({
          type: 'compatibility',
          summary: `У вас ${commonInterests.length} общих интереса! Уровень совместимости: ${Math.round(avgScore * 10)}%`,
          details: {
            common_interests_count: commonInterests.length,
            compatibility_score: avgScore,
            top_common_interests: topInterests.map(ci => ({
              name: ci.interest.name,
              emoji: ci.interest.emoji,
              compatibility_score: ci.compatibility_score
            })),
            recommendation: this.generateCompatibilityRecommendation(topInterests)
          }
        });
      }
      
      // Ищем интересы, которые один любит, а другой не знает
      const potentialNewInterests = [];
      user1Interests.forEach(u1Interest => {
        if (u1Interest.preference === 'love') {
          const hasUser2 = user2Interests.find(u2 => u2.interest_id === u1Interest.interest_id);
          if (!hasUser2) {
            potentialNewInterests.push({
              interest: u1Interest.Interest,
              lover: 'user1',
              intensity: u1Interest.intensity
            });
          }
        }
      });
      
      user2Interests.forEach(u2Interest => {
        if (u2Interest.preference === 'love') {
          const hasUser1 = user1Interests.find(u1 => u1.interest_id === u2Interest.interest_id);
          if (!hasUser1) {
            potentialNewInterests.push({
              interest: u2Interest.Interest,
              lover: 'user2',
              intensity: u2Interest.intensity
            });
          }
        }
      });
      
      if (potentialNewInterests.length > 0) {
        const topSuggestion = potentialNewInterests
          .sort((a, b) => b.intensity - a.intensity)[0];
        
        insights.push({
          type: 'recommendation',
          summary: `Попробуйте ${topSuggestion.interest.name} вместе! ${topSuggestion.interest.emoji}`,
          details: {
            suggested_interest: {
              name: topSuggestion.interest.name,
              emoji: topSuggestion.interest.emoji,
              category: topSuggestion.interest.category
            },
            reason: 'Один из вас очень любит это, а второй еще не пробовал',
            lover: topSuggestion.lover,
            intensity: topSuggestion.intensity,
            triggers: { type: 'unshared_love_interest' }
          }
        });
      }
      
    } catch (error) {
      console.error('Error generating compatibility insights:', error);
    }
    
    return insights;
  }
  
  /**
   * Генерировать инсайты на основе паттернов активности
   */
  async generateActivityPatternInsights(pair) {
    const insights = [];
    
    try {
      // Анализируем недавние события
      const recentEvents = await Event.findAll({
        where: {
          pair_id: pair.id,
          event_date: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // последние 30 дней
          }
        },
        order: [['event_date', 'DESC']]
      });
      
      // Паттерн: низкая активность
      if (recentEvents.length < 3) {
        const daysSinceLastEvent = recentEvents.length > 0 
          ? Math.floor((Date.now() - new Date(recentEvents[0].event_date).getTime()) / (24 * 60 * 60 * 1000))
          : 30;
        
        insights.push({
          type: 'activity_pattern',
          summary: `Пора планировать что-то особенное! Ваше последнее свидание было ${daysSinceLastEvent} дней назад`,
          details: {
            pattern: 'low_activity',
            recent_events_count: recentEvents.length,
            days_since_last_event: daysSinceLastEvent,
            recommendation: 'Запланируйте романтическое свидание на эти выходные',
            triggers: { type: 'low_activity', threshold: 3, period_days: 30 }
          }
        });
      }
      
      // Паттерн: много событий одного типа
      const eventTypeDistribution = recentEvents.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {});
      
      const dominantType = Object.entries(eventTypeDistribution)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (dominantType && dominantType[1] >= 3 && recentEvents.length >= 5) {
        const typeLabels = {
          date: 'свиданий',
          memory: 'воспоминаний',
          plan: 'планов',
          travel: 'путешествий'
        };
        
        insights.push({
          type: 'activity_pattern',
          summary: `Вы часто создаете ${typeLabels[dominantType[0]] || dominantType[0]}. Попробуйте разнообразить!`,
          details: {
            pattern: 'repetitive_type',
            dominant_type: dominantType[0],
            dominant_count: dominantType[1],
            total_events: recentEvents.length,
            suggestion: 'Добавьте новые типы активностей для большего разнообразия',
            triggers: { type: 'repetitive_event_type', threshold: 0.6 }
          }
        });
      }
      
      // Паттерн: хорошая активность
      if (recentEvents.length >= 8) {
        const aiEvents = recentEvents.filter(e => e.source === 'AI_SUGGESTED').length;
        const userEvents = recentEvents.filter(e => e.source === 'USER_CREATED').length;
        
        insights.push({
          type: 'activity_pattern',
          summary: `Отлично! У вас ${recentEvents.length} событий за месяц. Так держать! 🎉`,
          details: {
            pattern: 'high_activity',
            total_events: recentEvents.length,
            ai_suggested: aiEvents,
            user_created: userEvents,
            balance_score: Math.abs(aiEvents - userEvents) <= 2 ? 'balanced' : 'unbalanced',
            encouragement: 'Вы отлично планируете время вместе!',
            triggers: { type: 'high_activity', threshold: 8, period_days: 30 }
          }
        });
      }
      
    } catch (error) {
      console.error('Error generating activity pattern insights:', error);
    }
    
    return insights;
  }
  
  /**
   * Генерировать инсайты-рекомендации на основе интересов и событий
   */
  async generateRecommendationInsights(pair) {
    const insights = [];
    
    try {
      // Получаем общие интересы, которых нет в недавних событиях
      const user1Interests = await UserInterest.findAll({
        where: { 
          user_id: pair.user1_id,
          preference: ['love', 'like']
        },
        include: [{ model: Interest, as: 'Interest' }]
      });
      
      const user2Interests = await UserInterest.findAll({
        where: { 
          user_id: pair.user2_id,
          preference: ['love', 'like']
        },
        include: [{ model: Interest, as: 'Interest' }]
      });
      
      const recentEvents = await Event.findAll({
        where: {
          pair_id: pair.id,
          event_date: {
            [Op.gte]: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // последние 2 недели
          }
        }
      });
      
      // Ищем интересы, которые не использовались в событиях
      const commonInterests = [];
      user1Interests.forEach(u1Interest => {
        const match = user2Interests.find(u2Interest => 
          u2Interest.interest_id === u1Interest.interest_id
        );
        if (match) {
          commonInterests.push({
            interest: u1Interest.Interest,
            avg_intensity: (u1Interest.intensity + match.intensity) / 2
          });
        }
      });
      
      // Фильтруем интересы, которые не упоминались в недавних событиях
      const unusedInterests = commonInterests.filter(ci => {
        const mentioned = recentEvents.some(event => 
          event.title.toLowerCase().includes(ci.interest.name.toLowerCase()) ||
          event.description?.toLowerCase().includes(ci.interest.name.toLowerCase())
        );
        return !mentioned;
      });
      
      if (unusedInterests.length > 0) {
        const bestUnused = unusedInterests
          .sort((a, b) => b.avg_intensity - a.avg_intensity)[0];
        
        const recommendations = this.generateInterestBasedRecommendations(bestUnused.interest);
        
        insights.push({
          type: 'recommendation',
          summary: `Давно не занимались ${bestUnused.interest.name}! ${bestUnused.interest.emoji}`,
          details: {
            unused_interest: {
              name: bestUnused.interest.name,
              emoji: bestUnused.interest.emoji,
              category: bestUnused.interest.category
            },
            avg_intensity: bestUnused.avg_intensity,
            specific_recommendations: recommendations,
            triggers: { type: 'unused_common_interest', days_without: 14 }
          }
        });
      }
      
      // Сезонные рекомендации
      const seasonalInsight = this.generateSeasonalRecommendation(commonInterests);
      if (seasonalInsight) {
        insights.push(seasonalInsight);
      }
      
    } catch (error) {
      console.error('Error generating recommendation insights:', error);
    }
    
    return insights;
  }
  
  /**
   * Проверить, существует ли похожий инсайт
   */
  async checkExistingInsight(pairId, insight) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return await Insight.findOne({
      where: {
        pair_id: pairId,
        insight_type: insight.type,
        generated_at: { [Op.gte]: oneDayAgo },
        summary: insight.summary
      }
    });
  }
  
  /**
   * Генерировать рекомендацию совместимости
   */
  generateCompatibilityRecommendation(commonInterests) {
    const interest = commonInterests[0].interest;
    const recommendations = {
      'Рестораны': 'Попробуйте новую кухню вместе!',
      'Кино': 'Устройте домашний киновечер или сходите в кинотеатр',
      'Путешествия': 'Запланируйте романтическую поездку на выходные',
      'Спорт': 'Займитесь парным спортом или сходите на матч',
      'Музыка': 'Сходите на концерт или устройте танцевальный вечер'
    };
    
    return recommendations[interest.name] || `Проведите время, занимаясь ${interest.name.toLowerCase()}`;
  }
  
  /**
   * Генерировать конкретные рекомендации на основе интереса
   */
  generateInterestBasedRecommendations(interest) {
    const recommendations = {
      'Рестораны': ['Попробуйте новую кухню', 'Устройте романтический ужин', 'Найдите ресторан с панорамным видом'],
      'Кино': ['Домашний киновечер', 'Сходите в кинотеатр IMAX', 'Фестиваль короткометражек'],
      'Музыка': ['Концерт любимого исполнителя', 'Джазовый клуб', 'Караоке-вечер'],
      'Спорт': ['Игра в боулинг', 'Катание на коньках', 'Мини-гольф'],
      'Путешествия': ['Однодневная поездка', 'Пикник в парке', 'Исследование нового района города']
    };
    
    return recommendations[interest.name] || [`Активность связанная с ${interest.name.toLowerCase()}`];
  }
  
  /**
   * Генерировать сезонную рекомендацию
   */
  generateSeasonalRecommendation(commonInterests) {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    
    let season, activities;
    
    if (month >= 2 && month <= 4) { // Весна
      season = 'весенние';
      activities = ['Прогулка в парке', 'Пикник на природе', 'Фотосессия с цветами'];
    } else if (month >= 5 && month <= 7) { // Лето
      season = 'летние';
      activities = ['Пляжный отдых', 'Велопрогулка', 'Кафе с террасой'];
    } else if (month >= 8 && month <= 10) { // Осень
      season = 'осенние';
      activities = ['Прогулка по золотым листьям', 'Уютное кафе', 'Фотосессия в парке'];
    } else { // Зима
      season = 'зимние';
      activities = ['Каток', 'Горячий шоколад в кафе', 'Новогодние ярмарки'];
    }
    
    return {
      type: 'recommendation',
      summary: `Время для ${season} активностей! ❄️🌸☀️🍂`,
      details: {
        season,
        seasonal_activities: activities,
        recommendation: `Используйте сезон по максимуму!`,
        triggers: { type: 'seasonal_recommendation', month, season }
      }
    };
  }
}

module.exports = new InsightGeneratorService();
