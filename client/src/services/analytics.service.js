/**
 * Analytics Service - обработка данных аналитики отношений
 * Работает с реальными данными из activity_logs и существующих таблиц
 */

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 минут
  }

  /**
   * Получить активности пользователя с сервера
   */
  async fetchUserActivities(userId, daysBack = 30) {
    try {
      const response = await fetch(`/api/user/activities?days=${daysBack}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.warn('Failed to fetch user activities, using fallback:', error);
      return [];
    }
  }

  /**
   * Вычисляет основные метрики аналитики
   * @param {Object} stats - статистика пользователя
   * @param {Array} events - события пользователя  
   * @param {Object} user - данные пользователя
   * @param {Array} activities - активности из activity_logs
   * @returns {Object} метрики аналитики
   */
  async calculateMetrics(stats, events = [], user = null, activities = null) {
    const now = new Date();
    const week = 7 * 24 * 60 * 60 * 1000;
    const month = 30 * 24 * 60 * 60 * 1000;
    
    // Получаем активности если не переданы
    if (!activities) {
      activities = await this.fetchUserActivities(user?.id, 30);
    }
    
    // Фильтруем события по периодам
    const eventsLastWeek = this.filterEventsByPeriod(events, week);
    const eventsLastMonth = this.filterEventsByPeriod(events, month);
    const sharedEvents = events.filter(e => e.isShared);
    
    // Фильтруем активности по периодам
    const activitiesLastWeek = this.filterActivitiesByPeriod(activities, week);
    const activitiesLastMonth = this.filterActivitiesByPeriod(activities, month);
    
    // 1. Interaction Frequency (используем реальные данные)
    const interactionFrequency = this.calculateIFFromActivities(activitiesLastWeek, stats);
    
    // 2. Shared Moments Count (из активностей + событий)
    const sharedMomentsCount = this.calculateSharedMoments(activities, sharedEvents);
    
    // 3. Engagement Depth (глубина вовлечения)
    const engagementDepth = this.calculateEngagementDepthFromActivities(activities, stats);
    
    // 4. Consistency (постоянство из логинов)
    const consistency = this.calculateConsistencyFromActivities(activities, stats);
    
    // 5. Love Language Distribution (из активностей)
    const loveLanguageDistribution = this.calculateLoveLanguagesFromActivities(activities, events, stats);
    
    // 6. Harmony Index (обновленная формула)
    const harmonyIndex = this.calculateHarmonyIndex(stats, {
      interactionFrequency,
      sharedMomentsCount,
      engagementDepth,
      consistency
    });
    
    // 7. Growth indicators
    const growthSignals = this.calculateGrowthSignalsFromActivities(activities, stats, user);
    
    return {
      harmonyIndex,
      interactionFrequency,
      sharedMomentsCount,
      engagementDepth,
      consistency,
      loveLanguageDistribution,
      growthSignals,
      breakdown: this.getHarmonyBreakdown(harmonyIndex, {
        interactionFrequency,
        sharedMomentsCount,  
        engagementDepth,
        consistency
      }),
      // Инсайты
      insights: this.generateInsightsFromActivities(activities, stats, {
        interactionFrequency,
        sharedMomentsCount,
        engagementDepth,
        consistency
      })
    };
  }

  /**
   * Фильтрует активности по периоду времени
   */
  filterActivitiesByPeriod(activities, periodMs) {
    const now = new Date();
    const cutoff = new Date(now.getTime() - periodMs);
    
    return activities.filter(activity => {
      const activityDate = new Date(activity.created_at);
      return activityDate >= cutoff;
    });
  }

  /**
   * Фильтрует события по периоду времени
   */
  filterEventsByPeriod(events, periodMs) {
    const now = new Date();
    const cutoff = new Date(now.getTime() - periodMs);
    
    return events.filter(event => {
      const eventDate = new Date(event.event_date || event.createdAt);
      return eventDate >= cutoff;
    });
  }

  /**
   * Interaction Frequency - из реальных активностей
   */
  calculateIFFromActivities(activitiesLastWeek, stats) {
    const actionCounts = activitiesLastWeek.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {});

    const eventActions = actionCounts.event_created || 0;
    const memoryActions = actionCounts.memory_created || 0;
    const mediaActions = actionCounts.media_shared || 0;
    const profileActions = actionCounts.profile_updated || 0;
    
    // Формула с весами из ТЗ (убрали игровые действия)
    const score = (eventActions * 4) + (memoryActions * 5) + 
                  (mediaActions * 3) + (profileActions * 2);
    
    return Math.min(100, score);
  }

  /**
   * Shared Moments - совместные моменты
   */
  calculateSharedMoments(activities, sharedEvents) {
    const sharedActivities = activities.filter(activity => 
      ['event_created', 'memory_created'].includes(activity.action) &&
      activity.payload?.is_shared !== false
    ).length;
    
    return sharedActivities + sharedEvents.length;
  }

  /**
   * Engagement Depth - из типов активностей
   */
  calculateEngagementDepthFromActivities(activities, stats) {
    const deepActivities = activities.filter(activity => 
      ['lesson_completed', 'gift_sent', 'mood_checkin'].includes(activity.action)
    ).length;
    
    const totalActivities = Math.max(1, activities.length);
    const deepRatio = deepActivities / totalActivities;
    
    return Math.min(100, (deepRatio * 60) + (stats.totalLoginDays * 0.5));
  }

  /**
   * Consistency - из логинов и активности
   */
  calculateConsistencyFromActivities(activities, stats) {
    const loginActivities = activities.filter(a => a.action === 'user_login');
    const uniqueDays = new Set(
      loginActivities.map(a => new Date(a.created_at).toDateString())
    ).size;
    
    const baseConsistency = stats.streakDays || 0;
    const recentConsistency = Math.min(30, uniqueDays * 3);
    
    return Math.min(100, baseConsistency + recentConsistency);
  }

  /**
   * Engagement Depth - глубина вовлечения
   */
  calculateEngagementDepth(stats, events) {
    const deepActivities = events.filter(e => 
      ['date', 'travel', 'anniversary', 'milestone'].includes(e.event_type)
    ).length;
    
    const totalActivities = Math.max(1, stats.events + stats.memories);
    const deepRatio = deepActivities / totalActivities;
    
    return Math.min(100, deepRatio * 80 + (stats.totalLoginDays * 0.5));
  }

  /**
   * Love Languages Distribution (старая версия)
   */
  calculateLoveLanguages(stats, events) {
    const total = Math.max(1, stats.events + stats.memories);
    
    // Анализируем типы событий
    const eventTypes = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    return {
      "Слова поддержки": Math.min(100, ((eventTypes.memory || 0) / total * 100) + 20),
      "Время вместе": Math.min(100, ((eventTypes.date || 0) / total * 100) + ((eventTypes.travel || 0) / total * 30) + 20),
      "Подарки": Math.min(100, ((eventTypes.gift || 0) / total * 100) + (stats.coins / 100)),
      "Помощь делом": Math.min(100, ((eventTypes.plan || 0) / total * 100) + 25),
      "Прикосновения": Math.min(100, ((eventTypes.travel || 0) / total * 100) + 30), // Путешествия как близость
      "Внимание": Math.min(100, (stats.streakDays * 2) + (stats.totalLoginDays * 0.5))
    };
  }

  /**
   * Love Languages Distribution - из активностей
   */
  calculateLoveLanguagesFromActivities(activities, events, stats) {
    const actionCounts = activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {});

    const total = Math.max(1, activities.length);

    return {
      "Слова поддержки": Math.min(100, 
        ((actionCounts.memory_created || 0) / total * 60) + 
        ((actionCounts.profile_updated || 0) / total * 40) + 20
      ),
      "Время вместе": Math.min(100, 
        ((actionCounts.event_created || 0) / total * 40) + 
        ((actionCounts.memory_created || 0) / total * 20) + 20
      ),
      "Подарки": Math.min(100, 
        ((actionCounts.gift_sent || 0) / total * 70) + 
        (stats.coins / 500) + 10
      ),
      "Помощь делом": Math.min(100, 
        ((actionCounts.quick_task_completed || 0) / total * 60) + 
        ((actionCounts.event_created || 0) / total * 20) + 25
      ),
      "Прикосновения": Math.min(100, 
        ((actionCounts.media_shared || 0) / total * 40) + 30
      ),
      "Внимание": Math.min(100, 
        ((actionCounts.user_login || 0) / total * 30) + 
        ((actionCounts.reaction_given || 0) / total * 40) + 
        (stats.streakDays * 2)
      )
    };
  }

  /**
   * Обновленный Harmony Index
   */
  calculateHarmonyIndex(stats, metrics) {
    const weights = {
      base: 0.30,           // Базовая активность  
      interaction: 0.25,    // Частота взаимодействий
      shared: 0.20,         // Совместные моменты
      depth: 0.15,          // Глубина вовлечения
      consistency: 0.10     // Постоянство
    };

    const baseScore = Math.min(100, Math.max(30, 
      (stats.events * 3) + (stats.memories * 2.5) + (stats.streakDays * 2) + 40
    ));

    const normalizedIF = Math.min(100, metrics.interactionFrequency);
    const normalizedSMC = Math.min(100, metrics.sharedMomentsCount * 10);
    const normalizedED = Math.min(100, metrics.engagementDepth);
    const normalizedCONS = Math.min(100, metrics.consistency * 3);

    const harmonyScore = Math.round(
      (weights.base * baseScore) +
      (weights.interaction * normalizedIF) +  
      (weights.shared * normalizedSMC) +
      (weights.depth * normalizedED) +
      (weights.consistency * normalizedCONS)
    );

    return Math.min(100, Math.max(0, harmonyScore));
  }

  /**
   * Breakdown компонентов Harmony Index
   */
  getHarmonyBreakdown(harmonyIndex, metrics) {
    const components = {
      "Базовая активность": Math.round(harmonyIndex * 0.30),
      "Частота взаимодействий": Math.round(harmonyIndex * 0.25),
      "Совместные моменты": Math.round(harmonyIndex * 0.20),
      "Глубина вовлечения": Math.round(harmonyIndex * 0.15),
      "Постоянство": Math.round(harmonyIndex * 0.10)
    };

    // Определяем топ драйверы
    const sortedComponents = Object.entries(components)
      .sort(([,a], [,b]) => b - a);

    return {
      components,
      topDrivers: sortedComponents.slice(0, 2).map(([name]) => name),
      weakestAreas: sortedComponents.slice(-2).map(([name]) => name)
    };
  }

  /**
   * Определение сигналов роста (старая версия)
   */
  calculateGrowthSignals(stats, events, user) {
    const signals = [];
    
    // Позитивные сигналы
    if (stats.streakDays >= 7) {
      signals.push({ type: 'positive', message: 'Отличная постоянность!', strength: 'high' });
    }
    
    if (stats.memories >= 10) {
      signals.push({ type: 'positive', message: 'Много совместных воспоминаний', strength: 'medium' });
    }

    // Сигналы внимания
    if (stats.events < 3) {
      signals.push({ type: 'attention', message: 'Мало совместных событий', strength: 'medium' });
    }
    
    if (stats.memories === 0) {
      signals.push({ type: 'attention', message: 'Создавайте воспоминания', strength: 'high' });
    }

    if (stats.memories < stats.events / 2) {
      signals.push({ type: 'attention', message: 'Создавайте больше воспоминаний', strength: 'low' });
    }

    return signals;
  }

  /**
   * Определение сигналов роста - из активностей
   */
  calculateGrowthSignalsFromActivities(activities, stats, user) {
    const signals = [];
    const actionCounts = activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {});
    
    // Позитивные сигналы из активностей
    if (actionCounts.user_login >= 7) {
      signals.push({ type: 'positive', message: 'Отличная постоянность входов!', strength: 'high' });
    }
    
    if (actionCounts.memory_created >= 5) {
      signals.push({ type: 'positive', message: 'Активно создаете воспоминания', strength: 'medium' });
    }

    if (actionCounts.memory_created >= 3) {
      signals.push({ type: 'positive', message: 'Создаете много воспоминаний!', strength: 'high' });
    }

    // Сигналы внимания
    if ((actionCounts.event_created || 0) < 2) {
      signals.push({ type: 'attention', message: 'Мало совместных событий', strength: 'medium' });
    }
    
    if (!actionCounts.memory_created) {
      signals.push({ type: 'attention', message: 'Создавайте воспоминания', strength: 'high' });
    }

    if ((actionCounts.memory_created || 0) < (actionCounts.event_created || 0) / 2) {
      signals.push({ type: 'attention', message: 'Создавайте больше воспоминаний', strength: 'low' });
    }

    return signals;
  }

  /**
   * Генерация практических инсайтов (старая версия)
   */
  generateInsights(stats, events, metrics) {
    const insights = [];

    // Инсайт по событиям
    if (stats.events < 5) {
      insights.push({
        type: 'actionable',
        title: 'Планируйте больше событий',
        message: 'У вас мало запланированных совместных активностей',
        action: 'Создать событие',
        priority: 'high',
        cta: '/calendar'
      });
    }

    // Инсайт по воспоминаниям vs событиям
    if (stats.memories < stats.events / 3) {
      insights.push({
        type: 'balance',
        title: 'Создавайте больше воспоминаний',
        message: 'Фиксируйте важные моменты в ваших отношениях',
        action: 'Создать воспоминание',
        priority: 'medium',
        cta: '/memories'
      });
    }

    // Инсайт по воспоминаниям
    if (stats.memories < 3) {
      insights.push({
        type: 'memory',
        title: 'Создавайте воспоминания',
        message: 'Фотографируйте и сохраняйте ваши моменты',
        action: 'Добавить фото',
        priority: 'medium',
        cta: '/memories'
      });
    }

    // Инсайт по постоянству
    if (stats.streakDays < 3) {
      insights.push({
        type: 'consistency',
        title: 'Развивайте постоянство',
        message: 'Ежедневные небольшие действия укрепляют отношения',
        action: 'Ежедневная активность',
        priority: 'low',
        cta: '/lessons'
      });
    }

    return insights.slice(0, 3); // Максимум 3 инсайта
  }

  /**
   * Генерация практических инсайтов - из активностей
   */
  generateInsightsFromActivities(activities, stats, metrics) {
    const insights = [];
    const actionCounts = activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {});

    // Инсайт по событиям
    if ((actionCounts.event_created || 0) < 3) {
      insights.push({
        type: 'actionable',
        title: 'Планируйте больше событий',
        message: 'За последний месяц мало совместных активностей',
        action: 'Создать событие',
        priority: 'high',
        cta: '/calendar'
      });
    }

    // Инсайт по воспоминаниям vs событиям
    if ((actionCounts.memory_created || 0) < (actionCounts.event_created || 0) / 3) {
      insights.push({
        type: 'balance',
        title: 'Создавайте больше воспоминаний',
        message: 'Фиксируйте важные моменты в ваших отношениях',
        action: 'Создать воспоминание',
        priority: 'medium',
        cta: '/memories'
      });
    }

    // Инсайт по воспоминаниям
    if (!actionCounts.memory_created) {
      insights.push({
        type: 'memory',
        title: 'Создавайте воспоминания',
        message: 'Фотографируйте и сохраняйте ваши моменты',
        action: 'Добавить фото',
        priority: 'medium',
        cta: '/memories'
      });
    }

    // Инсайт по постоянству
    if ((actionCounts.user_login || 0) < 7) {
      insights.push({
        type: 'consistency',
        title: 'Развивайте постоянство',
        message: 'Заходите чаще - это укрепляет связь',
        action: 'Ежедневная активность',
        priority: 'low',
        cta: '/lessons'
      });
    }

    // Инсайт по медиа
    if (!actionCounts.media_shared) {
      insights.push({
        type: 'sharing',
        title: 'Делитесь моментами',
        message: 'Добавляйте фото к событиям',
        action: 'Загрузить фото',
        priority: 'low',
        cta: '/calendar'
      });
    }

    return insights.slice(0, 3); // Максимум 3 инсайта
  }

  /**
   * Определение самого сильного аспекта
   */
  getStrongestAspect(stats, metrics) {
    const aspects = {
      'Планирование событий': stats.events * 1.5,
      'Создание воспоминаний': stats.memories * 2,
      'Постоянство': stats.streakDays * 1.2,
      'Активность': stats.totalLoginDays,
      'Эмоциональная связь': (stats.events + stats.memories) * 0.8
    };

    const strongest = Object.entries(aspects).reduce((max, [name, value]) => 
      value > max.value ? { name, value } : max, 
      { name: '', value: 0 }
    );

    return {
      name: strongest.name,
      value: `${Math.min(100, strongest.value * 10)}%`,
      description: "Ваша самая развитая сфера отношений"
    };
  }

  /**
   * Определение области наибольшего роста
   */
  getBiggestGrowth(stats, user) {
    // Простая эвристика на основе недавней активности
    const growthAreas = [];
    
    if (stats.streakDays > 0) {
      growthAreas.push({ area: 'Постоянство', growth: stats.streakDays * 5 });
    }
    
    if (stats.memories > 5) {
      growthAreas.push({ area: 'Создание воспоминаний', growth: 20 });
    }

    if (stats.events > 2) {
      growthAreas.push({ area: 'Планирование', growth: 12 });
    }

    const biggest = growthAreas.reduce((max, item) => 
      item.growth > max.growth ? item : max,
      { area: 'Общая активность', growth: 8 }
    );

    return {
      name: biggest.area,
      value: `+${biggest.growth}%`,
      description: "Заметный прогресс за последний месяц"
    };
  }

  /**
   * Определение области, требующей внимания
   */
  getNeedsAttention(stats, insights) {
    const highPriorityInsight = insights.find(i => i.priority === 'high');
    
    if (highPriorityInsight) {
      return {
        name: highPriorityInsight.title,
        value: "-15%",
        description: "Область для улучшения"
      };
    }

    // Дефолтные области внимания
    if (stats.events < 3) {
      return {
        name: "Планирование событий",
        value: "-20%",
        description: "Мало запланированных активностей"
      };
    }

    if (stats.memories === 0) {
      return {
        name: "Воспоминания",
        value: "-25%",
        description: "Не создаете совместные воспоминания"
      };
    }

    return {
      name: "Общая вовлеченность",
      value: "-8%",
      description: "Можно быть более активными"
    };
  }
}

export default new AnalyticsService();
