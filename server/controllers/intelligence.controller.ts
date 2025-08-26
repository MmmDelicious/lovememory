import { Request, Response, NextFunction } from 'express';
import aiOrchestrator from '../services/aiOrchestrator.service';
import { AIServiceError, ContextBuildError } from '../types/intelligence.types';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Intelligence Controller - Новый контроллер для Intelligence Core
 * Заменяет старый ai.controller.js
 */

/**
 * Обработка чата с AI Orchestrator
 */
export const handleChat = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { prompt } = req.body;
    const userId = req.user?.id;

    // Валидация
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ 
        success: false,
        message: 'Prompt is required and must be a string' 
      });
      return;
    }

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
      return;
    }

    console.log(`🎭 Intelligence Controller: Chat request from user ${userId}`);
    console.log(`📝 Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);

    // Вызываем AI Orchestrator
    const startTime = Date.now();
    const response = await aiOrchestrator.handleRequest(prompt, userId);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Intelligence Controller: Response generated in ${processingTime}ms`);

    // Формируем ответ
    res.json({
      success: true,
      data: {
        message: response.message,
        intent: response.intent,
        confidence: response.confidence,
        suggestions: response.suggestions,
        data: response.data,
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Intelligence Controller: Error in handleChat:', error);
    
    if (error instanceof ContextBuildError) {
      res.status(400).json({
        success: false,
        message: 'Failed to build user context',
        error: error.message
      });
      return;
    }

    if (error instanceof AIServiceError) {
      res.status(502).json({
        success: false,
        message: 'AI service temporarily unavailable',
        error: error.message
      });
      return;
    }

    next(error);
  }
};

/**
 * Генерация свиданий (отдельный endpoint)
 */
export const generateDate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { preferences } = req.body;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
      return;
    }

    console.log(`💕 Intelligence Controller: Date generation request from user ${userId}`);

    const startTime = Date.now();
    const response = await aiOrchestrator.handleRequest('Создай варианты свиданий', userId);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Intelligence Controller: Date options generated in ${processingTime}ms`);

    res.json({
      success: true,
      data: {
        options: response.data?.options || [],
        reasoning: response.data?.reasoning || [],
        metadata: {
          ...response.data?.metadata,
          processingTime,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Intelligence Controller: Error in generateDate:', error);
    next(error);
  }
};

/**
 * Анализ отношений (отдельный endpoint)
 */
export const analyzeRelationship = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
      return;
    }

    console.log(`📊 Intelligence Controller: Relationship analysis request from user ${userId}`);

    const startTime = Date.now();
    const response = await aiOrchestrator.handleRequest('Проанализируй наши отношения', userId);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Intelligence Controller: Analysis completed in ${processingTime}ms`);

    res.json({
      success: true,
      data: {
        message: response.message,
        analysis: response.data,
        metadata: {
          processingTime,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Intelligence Controller: Error in analyzeRelationship:', error);
    next(error);
  }
};

/**
 * Получение контекста пользователя (для отладки)
 */
export const getUserContext = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
      return;
    }

    // Только для разработки/отладки
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({ 
        success: false,
        message: 'This endpoint is not available in production' 
      });
      return;
    }

    const userContextService = (await import('../services/userContext.service')).default;
    const context = await userContextService.buildContext(userId);

    // Убираем чувствительные данные для отладки
    const debugContext = {
      user: {
        id: context.user.id,
        name: context.user.name,
        city: context.user.city
      },
      partner: context.partner ? {
        id: context.partner.id,
        name: context.partner.name,
        city: context.partner.city
      } : null,
      eventsCount: context.recentEvents.length,
      interactionsCount: context.aiInteractionHistory.length,
      relationshipProfile: {
        loveLanguages: context.relationshipProfile.loveLanguages,
        overallStrength: context.relationshipProfile.relationshipGraph.overallStrength,
        sentimentTrend: context.relationshipProfile.sentimentTrend,
        communicationStyle: context.relationshipProfile.communicationStyle
      },
      metadata: context.metadata
    };

    res.json({
      success: true,
      data: debugContext
    });

  } catch (error) {
    console.error('❌ Intelligence Controller: Error in getUserContext:', error);
    next(error);
  }
};

/**
 * Оценка качества ответа AI
 */
export const rateResponse = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { rating, feedback } = req.body;

    if (!userId) {
      res.status(401).json({ 
        success: false,
        message: 'User authentication required' 
      });
      return;
    }

    if (typeof rating !== 'number' || rating < -1 || rating > 1) {
      res.status(400).json({ 
        success: false,
        message: 'Rating must be a number between -1 and 1' 
      });
      return;
    }

    console.log(`⭐ Intelligence Controller: Rating ${rating} from user ${userId}`);

    // Сохраняем рейтинг
    const userContextService = (await import('../services/userContext.service')).default;
    await userContextService.saveAIInteraction(
      userId, 
      feedback || 'Rating feedback', 
      `User rated: ${rating}`, 
      'CHAT', 
      rating
    );

    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });

  } catch (error) {
    console.error('❌ Intelligence Controller: Error in rateResponse:', error);
    next(error);
  }
};

export default {
  handleChat,
  generateDate,
  analyzeRelationship,
  getUserContext,
  rateResponse
};
