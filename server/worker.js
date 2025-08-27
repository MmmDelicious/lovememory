#!/usr/bin/env node

/**
 * Worker Process - Отдельный процесс для обработки фоновых задач
 * 
 * Запуск: node worker.js
 * 
 * Этот процесс работает независимо от основного API сервера
 * и обрабатывает тяжелые задачи анализа в фоне
 */

require('dotenv').config();

const analysisWorker = require('./workers/analysisWorker');
const { createRedisConnection, checkRedisHealth } = require('./config/redis');
const queueService = require('./services/queue.service');

class WorkerProcess {
  constructor() {
    this.isRunning = false;
    this.setupGracefulShutdown();
  }

  async start() {
    console.log('🚀 Starting LoveMemory Worker Process...');
    console.log('📅 Started at:', new Date().toISOString());

    try {
      // 1. Проверяем Redis соединение
      const redisHealthy = await checkRedisHealth();
      if (!redisHealthy) {
        throw new Error('Redis is not available');
      }
      console.log('✅ Redis connection verified');

      // 2. Инициализируем сервис очередей
      await queueService.initialize();
      console.log('✅ Queue service initialized');

      // 3. Запускаем воркеры
      await analysisWorker.start();
      console.log('✅ Analysis workers started');

      this.isRunning = true;

      // 4. Показываем статистику
      await this.showStartupStats();

      // 5. Запускаем мониторинг
      this.startHealthMonitoring();

      console.log('🎉 Worker Process is running and ready to process jobs!');
      console.log('📊 Use Ctrl+C to gracefully shutdown');

    } catch (error) {
      console.error('❌ Failed to start Worker Process:', error);
      process.exit(1);
    }
  }

  async showStartupStats() {
    try {
      const queueStats = await queueService.getQueueStats();
      const workerStats = await analysisWorker.healthCheck();

      console.log('\n📊 Startup Statistics:');
      console.log('├── Queues:', Object.keys(queueStats).join(', '));
      console.log('├── Workers:', workerStats.workersCount);
      console.log('└── Environment:', process.env.NODE_ENV || 'development');

      // Показываем состояние очередей
      for (const [queueName, stats] of Object.entries(queueStats)) {
        if (!stats.error) {
          console.log(`📋 Queue "${queueName}":`, 
            `waiting: ${stats.waiting}, active: ${stats.active}, failed: ${stats.failed}`);
        }
      }
      console.log('');
    } catch (error) {
      console.error('Warning: Could not fetch startup stats:', error.message);
    }
  }

  startHealthMonitoring() {
    // Проверяем здоровье системы каждые 30 секунд
    setInterval(async () => {
      try {
        const queueHealth = await queueService.healthCheck();
        const workerHealth = await analysisWorker.healthCheck();

        if (queueHealth.status !== 'healthy' || !workerHealth.isRunning) {
          console.warn('⚠️ Health check warning:', {
            queue: queueHealth.status,
            workers: workerHealth.isRunning ? 'running' : 'stopped'
          });
        }
      } catch (error) {
        console.error('❌ Health check failed:', error.message);
      }
    }, 30000);

    // Логируем статистику каждые 5 минут
    setInterval(async () => {
      try {
        const stats = await queueService.getQueueStats();
        let totalJobs = 0;
        
        for (const [queueName, queueStats] of Object.entries(stats)) {
          if (!queueStats.error) {
            const queueTotal = queueStats.waiting + queueStats.active;
            totalJobs += queueTotal;
            
            if (queueTotal > 0) {
              console.log(`📈 Queue "${queueName}": ${queueTotal} pending jobs`);
            }
          }
        }

        if (totalJobs === 0) {
          console.log('😴 All queues are empty - worker is idle');
        }
      } catch (error) {
        console.error('Error logging stats:', error.message);
      }
    }, 5 * 60 * 1000);
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (!this.isRunning) {
        return;
      }

      console.log(`\n🔄 Received ${signal}, starting graceful shutdown...`);
      this.isRunning = false;

      try {
        // Останавливаем воркеры (завершают текущие задачи)
        console.log('⏹️ Stopping workers...');
        await analysisWorker.stop();

        // Закрываем сервис очередей
        console.log('📋 Closing queue service...');
        await queueService.shutdown();

        console.log('✅ Worker Process shutdown complete');
        process.exit(0);

      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Обрабатываем сигналы завершения
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Обрабатываем необработанные ошибки
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  // Методы для управления воркером через API
  async pause() {
    await queueService.pauseQueue('analysis');
    await queueService.pauseQueue('insights');
    console.log('⏸️ Worker paused');
  }

  async resume() {
    await queueService.resumeQueue('analysis');
    await queueService.resumeQueue('insights');
    console.log('▶️ Worker resumed');
  }

  async getStatus() {
    const queueHealth = await queueService.healthCheck();
    const workerHealth = await analysisWorker.healthCheck();
    
    return {
      isRunning: this.isRunning,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      queues: queueHealth,
      workers: workerHealth,
      timestamp: new Date().toISOString()
    };
  }
}

// Запуск воркера если файл вызван напрямую
if (require.main === module) {
  const worker = new WorkerProcess();
  worker.start().catch(error => {
    console.error('💥 Fatal error starting worker:', error);
    process.exit(1);
  });
}

module.exports = WorkerProcess;

