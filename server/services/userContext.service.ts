import { Op } from 'sequelize';
import { 
  UserContext, 
  UserData, 
  PartnerData, 
  EventData, 
  AIInteraction, 
  ActivityLogData, 
  PairData,
  RelationshipProfile as IRelationshipProfile,
  IUserContextService,
  AIIntent,
  ContextBuildError
} from '../types/intelligence.types';

// Импорты моделей (будут работать с JS моделями пока они не переписаны)
const { 
  User, 
  Event, 
  ActivityLog,
  Pair
} = require('../models');

// Импорт TS модели
import RelationshipProfile from '../models/RelationshipProfile';

/**
 * UserContextService - Сервис сбора полного контекста пользователя
 * Это центральная точка Intelligence Core, которая собирает ВСЮ информацию
 * о пользователе для передачи в AI Orchestrator
 */
class UserContextService implements IUserContextService {
  
  /**
   * Главный метод - собирает полный контекст пользователя
   * @param userId - ID пользователя
   * @returns Полный контекст для AI
   */
  async buildContext(userId: string): Promise<UserContext> {
    try {
      // Параллельно загружаем все необходимые данные
      const [
        user,
        partner,
        recentEvents,
        aiInteractionHistory,
        relationshipProfile,
        activityLogs,
        pairData
      ] = await Promise.all([
        this.getUser(userId),
        this.getPartner(userId),
        this.getRecentEvents(userId, 20),
        this.getAIInteractionHistory(userId, 50),
        this.getRelationshipProfile(userId),
        this.getActivityLogs(userId, 30),
        this.getPairData(userId)
      ]);

      const context: UserContext = {
        user,
        partner,
        recentEvents,
        aiInteractionHistory,
        relationshipProfile,
        activityLogs,
        pairData,
        metadata: {
          contextBuiltAt: new Date(),
          dataFreshness: this.calculateDataFreshness(relationshipProfile),
          hasPartner: !!partner,
          totalEvents: recentEvents.length,
          totalInteractions: aiInteractionHistory.length
        }
      };

      return context;

    } catch (error) {
      console.error('❌ UserContextService: Error building context:', error);
      throw new ContextBuildError(`Failed to build user context: ${error.message}`, { userId, error });
    }
  }

  /**
   * Облегченный контекст для быстрых операций
   */
  async buildLightContext(userId: string): Promise<Partial<UserContext>> {
    const [user, relationshipProfile] = await Promise.all([
      this.getUser(userId),
      this.getRelationshipProfile(userId)
    ]);

    return {
      user,
      relationshipProfile,
      metadata: {
        contextType: 'light',
        contextBuiltAt: new Date(),
        dataFreshness: this.calculateDataFreshness(relationshipProfile),
        hasPartner: false,
        totalEvents: 0,
        totalInteractions: 0
      }
    };
  }

  /**
   * Получает данные пользователя
   */
  private async getUser(userId: string): Promise<UserData> {
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 'name', 'email', 'gender', 'city', 'location',
        'coins', 'avatar', 'created_at', 'timezone', 'language'
      ]
    });

    if (!user) {
      throw new ContextBuildError(`User not found: ${userId}`);
    }

    return user.toJSON() as UserData;
  }

  /**
   * Получает данные партнера
   */
  private async getPartner(userId: string): Promise<PartnerData | undefined> {
    try {
      // Сначала ищем связь в парах
      const pairRelation = await Pair.findOne({
        where: {
          [Op.or]: [
            { user1_id: userId },
            { user2_id: userId }
          ],
          status: 'active'
        }
      });

      if (!pairRelation) {
        return undefined;
      }

      // Определяем ID партнера
      const partnerId = pairRelation.user1_id === userId ? 
        pairRelation.user2_id : pairRelation.user1_id;

      // Получаем данные партнера
      const partner = await User.findByPk(partnerId, {
        attributes: [
          'id', 'name', 'gender', 'city', 'location',
          'avatar', 'timezone', 'language'
        ]
      });

      return partner ? partner.toJSON() as PartnerData : undefined;

    } catch (error) {
      console.warn('Warning: Could not fetch partner data:', error.message);
      return undefined;
    }
  }

  /**
   * Получает последние события
   */
  private async getRecentEvents(userId: string, limit: number = 20): Promise<EventData[]> {
    try {
      const events = await Event.findAll({
        where: {
          [Op.or]: [
            { user_id: userId },
            { shared_with: { [Op.contains]: [userId] } }
          ]
        },
        order: [['event_date', 'DESC']],
        limit,
        attributes: [
          'id', 'title', 'description', 'event_date', 'end_date',
          'event_type', 'location', 'metadata', 'created_at'
        ]
      });

      return events.map((event: any) => event.toJSON() as EventData);

    } catch (error) {
      console.warn('Warning: Could not fetch recent events:', error.message);
      return [];
    }
  }

  /**
   * Получает историю взаимодействий с AI
   */
  private async getAIInteractionHistory(userId: string, limit: number = 50): Promise<AIInteraction[]> {
    try {
      // Пока используем ActivityLog, позже создадим отдельную таблицу
      const interactions = await ActivityLog.findAll({
        where: {
          user_id: userId,
          activity_type: 'ai_interaction'
        },
        order: [['created_at', 'DESC']],
        limit,
        attributes: ['id', 'activity_data', 'created_at']
      });

      return interactions.map((interaction: any) => ({
        id: interaction.id,
        prompt: interaction.activity_data.prompt || '',
        response: interaction.activity_data.response || '',
        intent: interaction.activity_data.intent || 'CHAT' as AIIntent,
        rating: interaction.activity_data.rating,
        createdAt: interaction.created_at
      }));

    } catch (error) {
      console.warn('Warning: Could not fetch AI interaction history:', error.message);
      return [];
    }
  }

  /**
   * Получает логи активности
   */
  private async getActivityLogs(userId: string, daysBack: number = 30): Promise<ActivityLogData[]> {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysBack);

      const logs = await ActivityLog.findAll({
        where: {
          user_id: userId,
          created_at: {
            [Op.gte]: dateThreshold
          }
        },
        order: [['created_at', 'DESC']],
        attributes: [
          'id', 'activity_type', 'activity_data', 'created_at'
        ]
      });

      return logs.map((log: any) => log.toJSON() as ActivityLogData);

    } catch (error) {
      console.warn('Warning: Could not fetch activity logs:', error.message);
      return [];
    }
  }

  /**
   * Получает данные о паре
   */
  private async getPairData(userId: string): Promise<PairData | undefined> {
    try {
      const pairData = await Pair.findOne({
        where: {
          [Op.or]: [
            { user1_id: userId },
            { user2_id: userId }
          ],
          status: 'active'
        },
        attributes: [
          'id', 'created_at', 'status', 'pair_name',
          'anniversary_date', 'relationship_stage'
        ]
      });

      return pairData ? pairData.toJSON() as PairData : undefined;

    } catch (error) {
      console.warn('Warning: Could not fetch pair data:', error.message);
      return undefined;
    }
  }

  /**
   * Получает или создает профиль отношений
   */
  private async getRelationshipProfile(userId: string): Promise<IRelationshipProfile> {
    try {
      const { profile, created } = await RelationshipProfile.findOrCreateByUserId(userId);
      
      if (created) {
        }

      return profile.toJSON() as IRelationshipProfile;

    } catch (error) {
      console.error('Error getting relationship profile:', error);
      // Возвращаем базовый профиль
      return {
        id: `temp-${userId}`,
        userId,
        loveLanguages: {
          physical_touch: 0.2,
          quality_time: 0.2,
          words_of_affirmation: 0.2,
          acts_of_service: 0.2,
          receiving_gifts: 0.2
        },
        relationshipGraph: {
          nodes: [],
          connections: [],
          overallStrength: 75
        },
        sentimentTrend: 0.0,
        activityPatterns: {
          timePreferences: { morning: 0.1, afternoon: 0.3, evening: 0.5, night: 0.1 },
          budgetLevel: 'medium',
          categoryPreferences: {},
          frequencyScore: 0.5
        },
        communicationStyle: {
          preferredTone: 'friendly',
          responseLength: 'medium',
          humorLevel: 0.7,
          formalityLevel: 0.3
        },
        aiInteractionQuality: {
          averageRating: 0,
          totalInteractions: 0,
          positiveResponses: 0,
          negativeResponses: 0
        },
        version: 1,
        lastAnalyzedAt: new Date(),
        analysisStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  /**
   * Вычисляет свежесть данных
   */
  private calculateDataFreshness(relationshipProfile: IRelationshipProfile): 'fresh' | 'moderate' | 'stale' {
    if (!relationshipProfile.lastAnalyzedAt) {
      return 'stale';
    }

    const hoursAgo = (new Date().getTime() - new Date(relationshipProfile.lastAnalyzedAt).getTime()) / (1000 * 60 * 60);
    
    if (hoursAgo < 24) return 'fresh';
    if (hoursAgo < 168) return 'moderate'; // 7 days
    return 'stale';
  }

  /**
   * Сохраняет взаимодействие с AI
   */
  async saveAIInteraction(
    userId: string, 
    prompt: string, 
    response: string, 
    intent: AIIntent = 'CHAT', 
    rating?: number
  ): Promise<void> {
    try {
      await ActivityLog.create({
        user_id: userId,
        activity_type: 'ai_interaction',
        activity_data: {
          prompt,
          response,
          intent,
          rating,
          timestamp: new Date()
        }
      });

      // Обновляем качество взаимодействий в профиле
      if (rating !== undefined && rating !== null) {
        const relationshipProfile = await RelationshipProfile.findOne({
          where: { userId }
        });

        if (relationshipProfile) {
          relationshipProfile.updateInteractionQuality(rating);
          await relationshipProfile.save();
        }
      }

    } catch (error) {
      console.error('Error saving AI interaction:', error);
    }
  }
}

export default new UserContextService();
