const { Queue, QueueEvents } = require('bullmq');
const { getRedisClient } = require('../config/redis');

/**
 * Queue Service - Управление фоновыми задачами
 * 
 * Типы задач:
 * - ANALYZE_USER: анализ профиля пользователя
 * - GENERATE_INSIGHTS: генерация инсайтов
 * - CLEANUP_DATA: очистка старых данных
 */

class QueueService {
  constructor() {
    this.queues = new Map();
    this.queueEvents = new Map();
    this.connection = null;
    this.isInitialized = false;
  }

  /**
   * Инициализация сервиса очередей
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log('🚀 Initializing Queue Service...');

    try {
      // Получаем Redis соединение
      this.connection = getRedisClient();
      await this.connection.ping(); // Проверяем соединение

      // Создаем очереди
      await this.createQueues();
      
      // Настраиваем мониторинг
      this.setupQueueMonitoring();

      this.isInitialized = true;
      console.log('✅ Queue Service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Queue Service:', error);
      throw error;
    }
  }

  /**
   * Создание очередей
   */
  async createQueues() {
    const queueConfig = {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 50, // Хранить только последние 50 выполненных задач
        removeOnFail: 100,    // Хранить 100 проваленных задач для анализа
        attempts: 3,          // 3 попытки выполнения
        backoff: {
          type: 'exponential',
          delay: 2000,        // Начальная задержка 2 сек
        },
      }
    };

    // Очередь для анализа пользователей
    const analysisQueue = new Queue('analysis', queueConfig);
    this.queues.set('analysis', analysisQueue);

    // Очередь для генерации инсайтов
    const insightsQueue = new Queue('insights', queueConfig);
    this.queues.set('insights', insightsQueue);

    // Очередь для служебных задач
    const maintenanceQueue = new Queue('maintenance', {
      ...queueConfig,
      defaultJobOptions: {
        ...queueConfig.defaultJobOptions,
        removeOnComplete: 10,
        removeOnFail: 50,
      }
    });
    this.queues.set('maintenance', maintenanceQueue);

    console.log('📋 Created queues:', Array.from(this.queues.keys()));
  }

  /**
   * Настройка мониторинга очередей
   */
  setupQueueMonitoring() {
    for (const [name, queue] of this.queues) {
      const queueEvents = new QueueEvents(name, { connection: this.connection });
      this.queueEvents.set(name, queueEvents);

      // Логирование событий
      queueEvents.on('completed', ({ jobId, returnvalue }) => {
        console.log(`✅ Job ${jobId} completed in queue ${name}`);
      });

      queueEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`❌ Job ${jobId} failed in queue ${name}:`, failedReason);
      });

      queueEvents.on('stalled', ({ jobId }) => {
        console.warn(`⚠️ Job ${jobId} stalled in queue ${name}`);
      });
    }
  }

  /**
   * Добавление задачи анализа пользователя
   */
  async addAnalysisJob(userId, options = {}) {
    const queue = this.queues.get('analysis');
    if (!queue) {
      throw new Error('Analysis queue not initialized');
    }

    const jobData = {
      userId,
      type: 'ANALYZE_USER',
      timestamp: new Date(),
      ...options
    };

    const jobOptions = {
      priority: options.priority || 10, // Высокий приоритет = меньше число
      delay: options.delay || 0,        // Задержка выполнения
      jobId: `analysis-${userId}-${Date.now()}`, // Уникальный ID
    };

    console.log(`📊 Adding analysis job for user ${userId}`);
    
    const job = await queue.add('analyze-user', jobData, jobOptions);
    return job;
  }

  /**
   * Добавление задачи генерации инсайтов
   */
  async addInsightJob(userId, eventId, options = {}) {
    const queue = this.queues.get('insights');
    if (!queue) {
      throw new Error('Insights queue not initialized');
    }

    const jobData = {
      userId,
      eventId,
      type: 'GENERATE_INSIGHTS',
      timestamp: new Date(),
      ...options
    };

    const jobOptions = {
      priority: options.priority || 20,
      delay: options.delay || 5000, // Подождать 5 сек после события
      jobId: `insights-${userId}-${eventId}-${Date.now()}`,
    };

    console.log(`💡 Adding insight job for user ${userId}, event ${eventId}`);
    
    const job = await queue.add('generate-insights', jobData, jobOptions);
    return job;
  }

  /**
   * Добавление задачи очистки данных
   */
  async addCleanupJob(type, options = {}) {
    const queue = this.queues.get('maintenance');
    if (!queue) {
      throw new Error('Maintenance queue not initialized');
    }

    const jobData = {
      type: 'CLEANUP_DATA',
      cleanupType: type, // 'old_interactions', 'failed_jobs', etc.
      timestamp: new Date(),
      ...options
    };

    const jobOptions = {
      priority: 30, // Низкий приоритет
      delay: options.delay || 0,
      jobId: `cleanup-${type}-${Date.now()}`,
    };

    console.log(`🧹 Adding cleanup job: ${type}`);
    
    const job = await queue.add('cleanup', jobData, jobOptions);
    return job;
  }

  /**
   * Получение статистики очередей
   */
  async getQueueStats() {
    const stats = {};

    for (const [name, queue] of this.queues) {
      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(), 
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed()
        ]);

        stats[name] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length
        };
      } catch (error) {
        console.error(`Error getting stats for queue ${name}:`, error);
        stats[name] = { error: error.message };
      }
    }

    return stats;
  }

  /**
   * Приостановка очереди
   */
  async pauseQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.pause();
      console.log(`⏸️ Queue ${queueName} paused`);
    }
  }

  /**
   * Возобновление очереди
   */
  async resumeQueue(queueName) {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.resume();
      console.log(`▶️ Queue ${queueName} resumed`);
    }
  }

  /**
   * Очистка очереди
   */
  async clearQueue(queueName, status = 'completed') {
    const queue = this.queues.get(queueName);
    if (queue) {
      await queue.clean(0, 1000, status);
      console.log(`🧹 Cleared ${status} jobs from queue ${queueName}`);
    }
  }

  /**
   * Корректное закрытие сервиса
   */
  async shutdown() {
    console.log('🔄 Shutting down Queue Service...');

    // Закрываем мониторинг событий
    for (const [name, queueEvents] of this.queueEvents) {
      await queueEvents.close();
      console.log(`📋 Closed events for queue ${name}`);
    }

    // Закрываем очереди
    for (const [name, queue] of this.queues) {
      await queue.close();
      console.log(`📋 Closed queue ${name}`);
    }

    this.queues.clear();
    this.queueEvents.clear();
    this.isInitialized = false;

    console.log('✅ Queue Service shutdown complete');
  }

  /**
   * Проверка доступности сервиса
   */
  async healthCheck() {
    if (!this.isInitialized) {
      return { status: 'error', message: 'Queue service not initialized' };
    }

    try {
      await this.connection.ping();
      const stats = await this.getQueueStats();
      
      return {
        status: 'healthy',
        queues: Object.keys(stats),
        stats
      };
    } catch (error) {
      return {
        status: 'error', 
        message: error.message
      };
    }
  }
}

// Экспортируем синглтон
module.exports = new QueueService();

