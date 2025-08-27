const express = require('express');
const queueController = require('../controllers/queue.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Queue Management Routes
 * Управление фоновыми задачами и очередями
 */

/**
 * GET /api/queue/status
 * Получение статуса всех очередей
 */
router.get('/status', queueController.getQueueStatus);

/**
 * GET /api/queue/health
 * Проверка здоровья системы очередей
 */
router.get('/health', queueController.healthCheck);

// Защищенные роуты (требуют аутентификации)
router.use(authMiddleware);

/**
 * POST /api/queue/analysis
 * Добавление задачи анализа пользователя
 * 
 * Body: { priority?: number, delay?: number }
 */
router.post('/analysis', queueController.addAnalysisJob);

/**
 * POST /api/queue/insight
 * Добавление задачи генерации инсайтов
 * 
 * Body: { eventId: string, priority?: number, delay?: number }
 */
router.post('/insight', queueController.addInsightJob);

/**
 * POST /api/queue/manage
 * Управление очередью (пауза/возобновление/очистка)
 * 
 * Body: { queueName: string, action: 'pause'|'resume'|'clear' }
 */
router.post('/manage', queueController.manageQueue);

/**
 * DELETE /api/queue/clear-all
 * Очистка всех очередей (только для разработки)
 */
router.delete('/clear-all', queueController.clearAllQueues);

module.exports = router;

