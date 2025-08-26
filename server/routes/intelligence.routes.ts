import express from 'express';
import intelligenceController from '../controllers/intelligence.controller';

// Импортируем middleware (пока из JS файлов)
const authMiddleware = require('../middleware/auth.middleware');
const rateLimitMiddleware = require('../middleware/rateLimit.middleware');

const router = express.Router();

/**
 * Intelligence Core Routes
 * Новые маршруты для Intelligence Core системы
 */

// Применяем middleware для всех роутов
router.use(authMiddleware); // Требуем аутентификацию
router.use(rateLimitMiddleware.aiInteraction); // Ограничиваем частоту запросов

/**
 * POST /api/intelligence/chat
 * Основной чат с AI Orchestrator
 * 
 * Body: { prompt: string }
 * Response: { success: boolean, data: AIResponse }
 */
router.post('/chat', intelligenceController.handleChat);

/**
 * POST /api/intelligence/generate-date
 * Генерация вариантов свиданий
 * 
 * Body: { preferences?: object }
 * Response: { success: boolean, data: DateGenerationResponse }
 */
router.post('/generate-date', intelligenceController.generateDate);

/**
 * GET /api/intelligence/analyze-relationship
 * Анализ отношений пользователя
 * 
 * Response: { success: boolean, data: RelationshipAnalysis }
 */
router.get('/analyze-relationship', intelligenceController.analyzeRelationship);

/**
 * POST /api/intelligence/rate
 * Оценка качества ответа AI
 * 
 * Body: { rating: number (-1 to 1), feedback?: string }
 * Response: { success: boolean, message: string }
 */
router.post('/rate', intelligenceController.rateResponse);

/**
 * GET /api/intelligence/context
 * Получение контекста пользователя (только для отладки)
 * 
 * Response: { success: boolean, data: UserContext }
 */
router.get('/context', intelligenceController.getUserContext);

export default router;
