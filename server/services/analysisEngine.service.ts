import { Op } from 'sequelize';
import { 
  AnalysisRequest, 
  AnalysisResult, 
  RelationshipProfile as IRelationshipProfile,
  IAnalysisEngine,
  LoveLanguages,
  RelationshipGraph,
  ActivityPatterns,
  AnalysisError,
  UserContext,
  EventData
} from '../types/intelligence.types';

import RelationshipProfile from '../models/RelationshipProfile';
import userContextService from './userContext.service';

// Импорты JS моделей
const { Event, ActivityLog, User } = require('../models');
const aiService = require('./ai.service');

/**
 * Analysis Engine - Фоновый анализатор данных
 * Обновляет RelationshipProfile на основе активности пользователя
 */
class AnalysisEngine implements IAnalysisEngine {

  /**
   * Главный метод анализа пользователя
   */
  async analyzeUser(request: AnalysisRequest): Promise<AnalysisResult> {
    console.log(`🔬 AnalysisEngine: Starting analysis for user ${request.userId}`);
    
    try {
      const context = await userContextService.buildContext(request.userId);
      let analysisResults: AnalysisResult[] = [];

      // Определяем что анализировать
      const analysisTypes = request.analysisType ? [request.analysisType] : 
        ['love_languages', 'sentiment', 'activity_patterns'];

      // Выполняем анализы параллельно
      const analyses = await Promise.allSettled(
        analysisTypes.map(type => this.performSpecificAnalysis(type, context))
      );

      // Собираем результаты
      analyses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          analysisResults.push(result.value);
        } else {
          console.error(`Analysis ${analysisTypes[index]} failed:`, result.reason);
        }
      });

      // Обновляем профиль отношений
      const updatedProfile = await this.updateRelationshipProfile(request.userId, analysisResults);

      console.log(`✅ AnalysisEngine: Analysis completed for user ${request.userId}`);

      return {
        userId: request.userId,
        analysisType: request.analysisType || 'full',
        result: updatedProfile,
        confidence: this.calculateOverallConfidence(analysisResults),
        analyzedAt: new Date(),
        dataUsed: {
          eventsCount: context.recentEvents.length,
          interactionsCount: context.aiInteractionHistory.length,
          timeRange: {
            from: this.getEarliestDate(context),
            to: new Date()
          }
        }
      };

    } catch (error) {
      console.error('❌ AnalysisEngine: Error during analysis:', error);
      throw new AnalysisError(`Analysis failed for user ${request.userId}: ${error.message}`, { request, error });
    }
  }

  /**
   * Обновляет профиль отношений
   */
  async updateRelationshipProfile(
    userId: string, 
    analysisResults: AnalysisResult[]
  ): Promise<IRelationshipProfile> {
    
    const profile = await RelationshipProfile.findOne({ where: { userId } });
    if (!profile) {
      throw new AnalysisError(`RelationshipProfile not found for user ${userId}`);
    }

    // Применяем результаты анализов
    for (const result of analysisResults) {
      switch (result.analysisType) {
        case 'love_languages':
          profile.loveLanguages = result.result as LoveLanguages;
          break;
        case 'sentiment':
          profile.sentimentTrend = result.result as number;
          break;
        case 'activity_patterns':
          profile.activityPatterns = result.result as ActivityPatterns;
          break;
        case 'relationship_graph':
          profile.relationshipGraph = result.result as RelationshipGraph;
          break;
      }
    }

    // Обновляем метаданные
    profile.version = (profile.version || 1) + 1;
    profile.lastAnalyzedAt = new Date();
    profile.analysisStatus = 'completed';

    await profile.save();
    return profile.toJSON() as IRelationshipProfile;
  }

  /**
   * Выполняет конкретный тип анализа
   */
  private async performSpecificAnalysis(
    analysisType: string, 
    context: UserContext
  ): Promise<AnalysisResult> {
    
    console.log(`🔍 Analyzing ${analysisType} for user ${context.user.id}`);

    switch (analysisType) {
      case 'love_languages':
        return await this.analyzeLoveLanguages(context);
      case 'sentiment':
        return await this.analyzeSentiment(context);
      case 'activity_patterns':
        return await this.analyzeActivityPatterns(context);
      case 'relationship_graph':
        return await this.analyzeRelationshipGraph(context);
      default:
        throw new AnalysisError(`Unknown analysis type: ${analysisType}`);
    }
  }

  /**
   * Анализ языков любви через AI
   */
  private async analyzeLoveLanguages(context: UserContext): Promise<AnalysisResult> {
    const events = context.recentEvents.slice(0, 15); // Последние 15 событий
    
    if (events.length < 3) {
      // Возвращаем дефолтные значения если данных мало
      return {
        userId: context.user.id,
        analysisType: 'love_languages',
        result: {
          physical_touch: 0.2,
          quality_time: 0.25,
          words_of_affirmation: 0.2,
          acts_of_service: 0.15,
          receiving_gifts: 0.2
        },
        confidence: 0.3,
        analyzedAt: new Date(),
        dataUsed: {
          eventsCount: events.length,
          interactionsCount: 0,
          timeRange: { from: new Date(), to: new Date() }
        }
      };
    }

    try {
      const eventsText = events.map(e => 
        `${e.title}: ${e.description || ''} (${e.event_type})`
      ).join('\n');

      const prompt = `Проанализируй события пользователя и определи его языки любви.
События:
${eventsText}

Верни ТОЛЬКО JSON объект в формате:
{
  "physical_touch": 0.0-1.0,
  "quality_time": 0.0-1.0, 
  "words_of_affirmation": 0.0-1.0,
  "acts_of_service": 0.0-1.0,
  "receiving_gifts": 0.0-1.0
}

Сумма всех значений должна быть примерно 1.0.`;

      const aiResponse = await aiService.getChatResponse(prompt, {});
      const result = JSON.parse(aiResponse.text);

      return {
        userId: context.user.id,
        analysisType: 'love_languages',
        result,
        confidence: 0.8,
        analyzedAt: new Date(),
        dataUsed: {
          eventsCount: events.length,
          interactionsCount: 0,
          timeRange: this.getTimeRange(events)
        }
      };

    } catch (error) {
      console.error('Error in love languages analysis:', error);
      // Fallback к базовым значениям
      return {
        userId: context.user.id,
        analysisType: 'love_languages',
        result: {
          physical_touch: 0.2,
          quality_time: 0.25,
          words_of_affirmation: 0.2,
          acts_of_service: 0.15,
          receiving_gifts: 0.2
        },
        confidence: 0.1,
        analyzedAt: new Date(),
        dataUsed: {
          eventsCount: events.length,
          interactionsCount: 0,
          timeRange: this.getTimeRange(events)
        }
      };
    }
  }

  /**
   * Анализ настроения через AI
   */
  private async analyzeSentiment(context: UserContext): Promise<AnalysisResult> {
    const recentEvents = context.recentEvents.slice(0, 10);
    const recentInteractions = context.aiInteractionHistory.slice(0, 10);

    if (recentEvents.length === 0 && recentInteractions.length === 0) {
      return {
        userId: context.user.id,
        analysisType: 'sentiment',
        result: 0.0, // нейтральное настроение
        confidence: 0.2,
        analyzedAt: new Date(),
        dataUsed: {
          eventsCount: 0,
          interactionsCount: 0,
          timeRange: { from: new Date(), to: new Date() }
        }
      };
    }

    try {
      const eventsText = recentEvents.map(e => 
        `${e.title}: ${e.description || ''}`
      ).join('\n');

      const interactionsText = recentInteractions.map(i => 
        `Запрос: ${i.prompt} | Ответ: ${i.response}`
      ).join('\n');

      const prompt = `Проанализируй настроение пользователя на основе его событий и общения с AI.

События:
${eventsText}

Общение с AI:
${interactionsText}

Верни ТОЛЬКО число от -1.0 до 1.0, где:
-1.0 = очень негативное настроение
0.0 = нейтральное настроение  
1.0 = очень позитивное настроение`;

      const aiResponse = await aiService.getChatResponse(prompt, {});
      const sentiment = parseFloat(aiResponse.text.trim());

      return {
        userId: context.user.id,
        analysisType: 'sentiment',
        result: isNaN(sentiment) ? 0.0 : Math.max(-1, Math.min(1, sentiment)),
        confidence: 0.75,
        analyzedAt: new Date(),
        dataUsed: {
          eventsCount: recentEvents.length,
          interactionsCount: recentInteractions.length,
          timeRange: this.getTimeRange([...recentEvents])
        }
      };

    } catch (error) {
      console.error('Error in sentiment analysis:', error);
      return {
        userId: context.user.id,
        analysisType: 'sentiment',
        result: 0.0,
        confidence: 0.1,
        analyzedAt: new Date(),
        dataUsed: {
          eventsCount: recentEvents.length,
          interactionsCount: recentInteractions.length,
          timeRange: this.getTimeRange(recentEvents)
        }
      };
    }
  }

  /**
   * Анализ паттернов активности
   */
  private async analyzeActivityPatterns(context: UserContext): Promise<AnalysisResult> {
    const events = context.recentEvents;
    
    // Анализируем временные предпочтения
    const timePreferences = this.analyzeTimePreferences(events);
    
    // Анализируем категории событий
    const categoryPreferences = this.analyzeCategoryPreferences(events);
    
    // Определяем бюджетный уровень (пока простая логика)
    const budgetLevel = this.determineBudgetLevel(events);
    
    // Частота активности
    const frequencyScore = this.calculateActivityFrequency(events);

    const result: ActivityPatterns = {
      timePreferences,
      budgetLevel,
      categoryPreferences,
      frequencyScore
    };

    return {
      userId: context.user.id,
      analysisType: 'activity_patterns',
      result,
      confidence: 0.7,
      analyzedAt: new Date(),
      dataUsed: {
        eventsCount: events.length,
        interactionsCount: 0,
        timeRange: this.getTimeRange(events)
      }
    };
  }

  /**
   * Анализ графа отношений (упрощенная версия)
   */
  private async analyzeRelationshipGraph(context: UserContext): Promise<AnalysisResult> {
    const events = context.recentEvents;
    
    // Создаем базовые узлы графа отношений
    const nodes = [
      {
        id: 'communication',
        label: 'Общение',
        strength: this.calculateCommunicationStrength(events, context.aiInteractionHistory),
        color: '#4F46E5',
        icon: '💬',
        x: 50,
        y: 30,
        activities: context.aiInteractionHistory.length,
        lastActivity: context.aiInteractionHistory[0]?.createdAt?.toISOString() || '',
        description: 'Качество и частота общения'
      },
      {
        id: 'shared_time',
        label: 'Совместное время',
        strength: this.calculateSharedTimeStrength(events),
        color: '#059669',
        icon: '⏰',
        x: 80,
        y: 60,
        activities: events.filter(e => e.event_type === 'date' || e.event_type === 'together').length,
        lastActivity: events[0]?.event_date?.toISOString() || '',
        description: 'Время, проведенное вместе'
      },
      {
        id: 'romance',
        label: 'Романтика',
        strength: this.calculateRomanceStrength(events),
        color: '#DC2626',
        icon: '💕',
        x: 20,
        y: 70,
        activities: events.filter(e => e.event_type === 'romantic' || e.event_type === 'date').length,
        lastActivity: events.find(e => e.event_type === 'romantic')?.event_date?.toISOString() || '',
        description: 'Романтические моменты'
      }
    ];

    // Создаем связи между узлами
    const connections = [
      {
        from: 'communication',
        to: 'shared_time',
        strength: 70,
        type: 'strong' as const
      },
      {
        from: 'shared_time',
        to: 'romance',
        strength: 60,
        type: 'medium' as const
      },
      {
        from: 'communication',
        to: 'romance',
        strength: 50,
        type: 'medium' as const
      }
    ];

    const overallStrength = Math.round(
      nodes.reduce((sum, node) => sum + node.strength, 0) / nodes.length
    );

    const relationshipGraph: RelationshipGraph = {
      nodes,
      connections,
      overallStrength
    };

    return {
      userId: context.user.id,
      analysisType: 'relationship_graph',
      result: relationshipGraph,
      confidence: 0.6,
      analyzedAt: new Date(),
      dataUsed: {
        eventsCount: events.length,
        interactionsCount: context.aiInteractionHistory.length,
        timeRange: this.getTimeRange(events)
      }
    };
  }

  /**
   * Вспомогательные методы анализа
   */
  private analyzeTimePreferences(events: EventData[]) {
    const timeDistribution = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    
    events.forEach(event => {
      const hour = new Date(event.event_date).getHours();
      if (hour >= 6 && hour < 12) timeDistribution.morning++;
      else if (hour >= 12 && hour < 17) timeDistribution.afternoon++;
      else if (hour >= 17 && hour < 22) timeDistribution.evening++;
      else timeDistribution.night++;
    });

    const total = events.length || 1;
    return {
      morning: timeDistribution.morning / total,
      afternoon: timeDistribution.afternoon / total,
      evening: timeDistribution.evening / total,
      night: timeDistribution.night / total
    };
  }

  private analyzeCategoryPreferences(events: EventData[]) {
    const categories: Record<string, number> = {};
    
    events.forEach(event => {
      const category = event.event_type || 'other';
      categories[category] = (categories[category] || 0) + 1;
    });

    const total = events.length || 1;
    Object.keys(categories).forEach(key => {
      categories[key] = categories[key] / total;
    });

    return categories;
  }

  private determineBudgetLevel(events: EventData[]): 'low' | 'medium' | 'high' {
    // Простая логика - можно улучшить
    const expensiveEvents = events.filter(e => 
      e.event_type === 'restaurant' || 
      e.event_type === 'travel' || 
      e.event_type === 'gift'
    ).length;

    const ratio = expensiveEvents / (events.length || 1);
    if (ratio > 0.4) return 'high';
    if (ratio > 0.2) return 'medium';
    return 'low';
  }

  private calculateActivityFrequency(events: EventData[]): number {
    if (events.length === 0) return 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentEvents = events.filter(e => new Date(e.event_date) > thirtyDaysAgo);
    
    return Math.min(1.0, recentEvents.length / 10); // 10 событий в месяц = 100% активность
  }

  private calculateCommunicationStrength(events: EventData[], interactions: any[]): number {
    const recentInteractions = interactions.filter(i => {
      const daysSince = (new Date().getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7; // последние 7 дней
    });

    const interactionScore = Math.min(100, recentInteractions.length * 10); // макс 100
    const communicationEvents = events.filter(e => 
      e.event_type === 'call' || e.event_type === 'message' || e.event_type === 'talk'
    ).length;
    
    const eventScore = Math.min(50, communicationEvents * 5);
    
    return Math.round(Math.max(30, interactionScore + eventScore));
  }

  private calculateSharedTimeStrength(events: EventData[]): number {
    const sharedEvents = events.filter(e => 
      e.event_type === 'date' || 
      e.event_type === 'together' || 
      e.event_type === 'activity'
    );

    const recentShared = sharedEvents.filter(e => {
      const daysSince = (new Date().getTime() - new Date(e.event_date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 14; // последние 2 недели
    });

    return Math.round(Math.max(20, Math.min(100, recentShared.length * 15)));
  }

  private calculateRomanceStrength(events: EventData[]): number {
    const romanticEvents = events.filter(e => 
      e.event_type === 'romantic' || 
      e.event_type === 'date' || 
      e.event_type === 'gift' ||
      e.title.toLowerCase().includes('романтик') ||
      e.title.toLowerCase().includes('свидание')
    );

    const recentRomantic = romanticEvents.filter(e => {
      const daysSince = (new Date().getTime() - new Date(e.event_date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 21; // последние 3 недели
    });

    return Math.round(Math.max(15, Math.min(100, recentRomantic.length * 20)));
  }

  /**
   * Утилиты
   */
  private calculateOverallConfidence(results: AnalysisResult[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  }

  private getTimeRange(events: EventData[]) {
    if (events.length === 0) {
      const now = new Date();
      return { from: now, to: now };
    }

    const dates = events.map(e => new Date(e.event_date));
    return {
      from: new Date(Math.min(...dates.map(d => d.getTime()))),
      to: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }

  private getEarliestDate(context: UserContext): Date {
    const eventDates = context.recentEvents.map(e => new Date(e.event_date));
    const interactionDates = context.aiInteractionHistory.map(i => new Date(i.createdAt));
    
    const allDates = [...eventDates, ...interactionDates];
    if (allDates.length === 0) return new Date();
    
    return new Date(Math.min(...allDates.map(d => d.getTime())));
  }

  /**
   * Планировщик фонового анализа
   */
  async scheduleBackgroundAnalysis(userId: string): Promise<void> {
    console.log(`📅 Scheduling background analysis for user ${userId}`);
    
    // Проверяем нужен ли анализ
    const profile = await RelationshipProfile.findOne({ where: { userId } });
    if (!profile || profile.needsAnalysis()) {
      // Запускаем анализ асинхронно
      setImmediate(() => {
        this.analyzeUser({ userId })
          .then(() => console.log(`✅ Background analysis completed for user ${userId}`))
          .catch(error => console.error(`❌ Background analysis failed for user ${userId}:`, error));
      });
    }
  }
}

export default new AnalysisEngine();
