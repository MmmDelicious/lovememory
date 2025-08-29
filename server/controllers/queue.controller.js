const queueService = require('../services/queue.service');
const { checkRedisHealth } = require('../config/redis');

/**
 * Queue Controller - Управление очередями и воркерами через API
 */

/**
 * Получение статуса очередей
 */
const getQueueStatus = async (req, res, next) => {
  try {
    const stats = await queueService.getQueueStats();
    const health = await queueService.healthCheck();
    const redisHealth = await checkRedisHealth();

    res.json({
      success: true,
      data: {
        redis: redisHealth ? 'connected' : 'disconnected',
        queues: stats,
        health: health.status,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting queue status:', error);
    next(error);
  }
};

/**
 * Добавление задачи анализа пользователя
 */
const addAnalysisJob = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { priority, delay } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Проверяем что сервис очередей инициализирован
    if (!queueService.isInitialized) {
      await queueService.initialize();
    }

    const job = await queueService.addAnalysisJob(userId, {
      priority: priority || 10,
      delay: delay || 0,
      source: 'manual_api'
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        userId,
        status: 'queued',
        estimatedStart: new Date(Date.now() + (delay || 0)),
        message: 'Analysis job added to queue'
      }
    });

  } catch (error) {
    console.error('Error adding analysis job:', error);
    next(error);
  }
};

/**
 * Добавление задачи генерации инсайтов
 */
const addInsightJob = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { eventId, priority, delay } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Event ID are required'
      });
    }

    if (!queueService.isInitialized) {
      await queueService.initialize();
    }

    const job = await queueService.addInsightJob(userId, eventId, {
      priority: priority || 20,
      delay: delay || 5000, // 5 секунд по умолчанию
      source: 'manual_api'
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        userId,
        eventId,
        status: 'queued',
        estimatedStart: new Date(Date.now() + (delay || 5000)),
        message: 'Insight job added to queue'
      }
    });

  } catch (error) {
    console.error('Error adding insight job:', error);
    next(error);
  }
};

/**
 * Управление очередью (пауза/возобновление)
 */
const manageQueue = async (req, res, next) => {
  try {
    const { queueName, action } = req.body;

    if (!['analysis', 'insights', 'maintenance'].includes(queueName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid queue name. Use: analysis, insights, or maintenance'
      });
    }

    if (!['pause', 'resume', 'clear'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use: pause, resume, or clear'
      });
    }

    if (!queueService.isInitialized) {
      await queueService.initialize();
    }

    let result;
    switch (action) {
      case 'pause':
        await queueService.pauseQueue(queueName);
        result = `Queue ${queueName} paused`;
        break;
      case 'resume':
        await queueService.resumeQueue(queueName);
        result = `Queue ${queueName} resumed`;
        break;
      case 'clear':
        await queueService.clearQueue(queueName, 'completed');
        result = `Queue ${queueName} cleared`;
        break;
    }

    res.json({
      success: true,
      data: {
        queueName,
        action,
        result,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error managing queue:', error);
    next(error);
  }
};

/**
 * Очистка всех очередей (только для разработки)
 */
const clearAllQueues = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This action is not allowed in production'
      });
    }

    if (!queueService.isInitialized) {
      await queueService.initialize();
    }

    await Promise.all([
      queueService.clearQueue('analysis', 'completed'),
      queueService.clearQueue('analysis', 'failed'),
      queueService.clearQueue('insights', 'completed'),
      queueService.clearQueue('insights', 'failed'),
      queueService.clearQueue('maintenance', 'completed'),
      queueService.clearQueue('maintenance', 'failed')
    ]);

    res.json({
      success: true,
      data: {
        message: 'All queues cleared',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error clearing queues:', error);
    next(error);
  }
};

/**
 * Проверка здоровья системы очередей
 */
const healthCheck = async (req, res, next) => {
  try {
    const redisHealth = await checkRedisHealth();
    let queueHealth = { status: 'not_initialized' };
    
    if (queueService.isInitialized) {
      queueHealth = await queueService.healthCheck();
    }

    const overall = redisHealth && queueHealth.status === 'healthy' ? 'healthy' : 'unhealthy';

    res.json({
      success: true,
      data: {
        overall,
        redis: redisHealth ? 'connected' : 'disconnected',
        queues: queueHealth,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      success: false,
      data: {
        overall: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Триггер анализа при добавлении события (автоматический)
 */
const triggerAnalysisOnEvent = async (userId, eventId) => {
  try {
    if (!queueService.isInitialized) {
      // Тихо пропускаем если очереди не инициализированы
      return;
    }

    // Добавляем задачу анализа с низким приоритетом и задержкой
    const analysisJob = await queueService.addAnalysisJob(userId, {
      priority: 30, // Низкий приоритет для автоматических задач
      delay: 10000, // 10 секунд задержка
      source: 'auto_event_trigger',
      eventId
    });

    // Добавляем задачу генерации инсайтов
    const insightJob = await queueService.addInsightJob(userId, eventId, {
      priority: 25,
      delay: 15000, // 15 секунд задержка
      source: 'auto_event_trigger'
    });

    // Тихо логируем успех только если нужно

  } catch (error) {
    // Тихо пропускаем ошибки - автоанализ не должен ломать основной flow
  }
};

module.exports = {
  getQueueStatus,
  addAnalysisJob,
  addInsightJob,
  manageQueue,
  clearAllQueues,
  healthCheck,
  triggerAnalysisOnEvent // Экспортируем для использования в других контроллерах
};
