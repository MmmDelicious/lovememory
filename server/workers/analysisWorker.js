const { Worker } = require('bullmq');
const { getRedisClient } = require('../config/redis');

/**
 * Analysis Worker - Фоновый обработчик задач анализа
 * 
 * Этот воркер работает в отдельном процессе и обрабатывает тяжелые задачи:
 * - Анализ профиля пользователя через AI
 * - Генерация инсайтов о отношениях
 * - Обновление RelationshipProfile
 */

class AnalysisWorker {
  constructor() {
    this.workers = [];
    this.connection = null;
    this.isRunning = false;
  }

  /**
   * Запуск воркеров
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Analysis workers already running');
      return;
    }

    console.log('🚀 Starting Analysis Workers...');

    try {
      // Подключение к Redis
      this.connection = getRedisClient();
      await this.connection.ping();

      // Создаем воркеры для разных типов задач
      await this.createWorkers();

      this.isRunning = true;
      console.log('✅ Analysis Workers started successfully');

    } catch (error) {
      console.error('❌ Failed to start Analysis Workers:', error);
      throw error;
    }
  }

  /**
   * Создание воркеров
   */
  async createWorkers() {
    const workerConfig = {
      connection: this.connection,
      concurrency: 2, // 2 задачи одновременно
      removeOnComplete: 50,
      removeOnFail: 100,
    };

    // Воркер для анализа пользователей
    const analysisWorker = new Worker('analysis', this.processAnalysisJob.bind(this), workerConfig);
    this.workers.push(analysisWorker);

    // Воркер для генерации инсайтов
    const insightsWorker = new Worker('insights', this.processInsightJob.bind(this), workerConfig);
    this.workers.push(insightsWorker);

    // Воркер для служебных задач
    const maintenanceWorker = new Worker('maintenance', this.processMaintenanceJob.bind(this), {
      ...workerConfig,
      concurrency: 1, // Служебные задачи по одной
    });
    this.workers.push(maintenanceWorker);

    // Настройка обработчиков событий
    this.setupWorkerEvents();

    console.log(`👷 Created ${this.workers.length} workers`);
  }

  /**
   * Обработка задач анализа пользователя
   */
  async processAnalysisJob(job) {
    const { userId, type } = job.data;
    console.log(`📊 Processing analysis job for user ${userId}`);

    try {
      // Обновляем прогресс
      await job.updateProgress(10);

      // Динамический импорт TS сервисов (пока заглушка)
      let analysisEngine;
      try {
        // В будущем: analysisEngine = require('../services/analysisEngine.service');
        analysisEngine = {
          analyzeUser: async (request) => {
            // Заглушка пока TS сервисы не скомпилированы
            console.log(`🧠 Mock analysis for user ${request.userId}`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Имитация работы
            return {
              userId: request.userId,
              analysisType: 'full',
              result: { status: 'completed' },
              confidence: 0.8,
              analyzedAt: new Date()
            };
          }
        };
      } catch (error) {
        console.warn('⚠️ Using mock analysis engine:', error.message);
      }

      await job.updateProgress(30);

      // Выполняем анализ
      const result = await analysisEngine.analyzeUser({ userId });
      
      await job.updateProgress(80);

      // Обновляем статус в базе (пока через прямой SQL)
      await this.updateAnalysisStatus(userId, 'completed');

      await job.updateProgress(100);

      console.log(`✅ Analysis completed for user ${userId}`);
      return { 
        success: true, 
        userId, 
        result,
        completedAt: new Date()
      };

    } catch (error) {
      console.error(`❌ Analysis failed for user ${userId}:`, error);
      
      // Обновляем статус ошибки
      await this.updateAnalysisStatus(userId, 'error');
      
      throw error;
    }
  }

  /**
   * Обработка задач генерации инсайтов
   */
  async processInsightJob(job) {
    const { userId, eventId, type } = job.data;
    console.log(`💡 Processing insight job for user ${userId}, event ${eventId}`);

    try {
      await job.updateProgress(20);

      // Заглушка для генерации инсайтов
      const insight = {
        userId,
        eventId,
        type: 'relationship_improvement',
        title: 'Отличное времяпрепровождение!',
        content: 'Ваше последнее событие показывает укрепление отношений. Продолжайте в том же духе!',
        confidence: 0.75,
        generatedAt: new Date()
      };

      await job.updateProgress(60);

      // Сохраняем инсайт в базу (пока заглушка)
      await this.saveInsight(insight);

      await job.updateProgress(100);

      console.log(`✅ Insight generated for user ${userId}`);
      return {
        success: true,
        insight,
        completedAt: new Date()
      };

    } catch (error) {
      console.error(`❌ Insight generation failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Обработка служебных задач
   */
  async processMaintenanceJob(job) {
    const { type, cleanupType } = job.data;
    console.log(`🧹 Processing maintenance job: ${cleanupType}`);

    try {
      await job.updateProgress(25);

      switch (cleanupType) {
        case 'old_interactions':
          await this.cleanupOldInteractions();
          break;
        case 'failed_jobs':
          await this.cleanupFailedJobs();
          break;
        case 'temp_files':
          await this.cleanupTempFiles();
          break;
        default:
          console.warn(`Unknown cleanup type: ${cleanupType}`);
      }

      await job.updateProgress(100);

      console.log(`✅ Maintenance completed: ${cleanupType}`);
      return {
        success: true,
        cleanupType,
        completedAt: new Date()
      };

    } catch (error) {
      console.error(`❌ Maintenance failed for ${cleanupType}:`, error);
      throw error;
    }
  }

  /**
   * Настройка обработчиков событий воркеров
   */
  setupWorkerEvents() {
    this.workers.forEach((worker, index) => {
      worker.on('completed', (job) => {
        console.log(`✅ Worker ${index} completed job ${job.id}`);
      });

      worker.on('failed', (job, err) => {
        console.error(`❌ Worker ${index} failed job ${job?.id}:`, err.message);
      });

      worker.on('error', (err) => {
        console.error(`❌ Worker ${index} error:`, err);
      });

      worker.on('stalled', (jobId) => {
        console.warn(`⚠️ Worker ${index} job ${jobId} stalled`);
      });
    });
  }

  /**
   * Вспомогательные методы
   */
  async updateAnalysisStatus(userId, status) {
    try {
      // Пока через прямой SQL, потом через TS модель
      const { sequelize } = require('../models');
      await sequelize.query(
        'UPDATE activity_logs SET activity_data = ? WHERE user_id = ? AND activity_type = ?',
        {
          replacements: [
            JSON.stringify({ analysis_status: status, updated_at: new Date() }),
            userId,
            'analysis_status'
          ]
        }
      );
      console.log(`📝 Updated analysis status for user ${userId}: ${status}`);
    } catch (error) {
      console.error('Error updating analysis status:', error);
    }
  }

  async saveInsight(insight) {
    try {
      // Заглушка - в будущем сохранить в таблицу Insights
      console.log(`💾 Saving insight for user ${insight.userId}:`, insight.title);
    } catch (error) {
      console.error('Error saving insight:', error);
    }
  }

  async cleanupOldInteractions() {
    console.log('🧹 Cleaning up old AI interactions...');
    // Удаляем взаимодействия старше 90 дней
    const { sequelize } = require('../models');
    const result = await sequelize.query(`
      DELETE FROM activity_logs 
      WHERE activity_type = 'ai_interaction' 
      AND created_at < NOW() - INTERVAL '90 days'
    `);
    console.log(`🗑️ Removed ${result[1]} old interactions`);
  }

  async cleanupFailedJobs() {
    console.log('🧹 Cleaning up failed jobs...');
    // BullMQ автоматически очистит failed jobs по настройкам
  }

  async cleanupTempFiles() {
    console.log('🧹 Cleaning up temp files...');
    // Очистка временных файлов
  }

  /**
   * Получение статистики воркеров
   */
  getWorkerStats() {
    return this.workers.map((worker, index) => ({
      id: index,
      queueName: worker.name,
      isRunning: worker.isRunning(),
      concurrency: worker.opts.concurrency
    }));
  }

  /**
   * Корректная остановка воркеров
   */
  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ Analysis workers not running');
      return;
    }

    console.log('🔄 Stopping Analysis Workers...');

    // Останавливаем всех воркеров
    await Promise.all(this.workers.map(worker => worker.close()));
    this.workers = [];
    this.isRunning = false;

    console.log('✅ Analysis Workers stopped');
  }

  /**
   * Проверка здоровья воркеров
   */
  async healthCheck() {
    return {
      isRunning: this.isRunning,
      workersCount: this.workers.length,
      workers: this.getWorkerStats()
    };
  }
}

// Экспортируем синглтон
module.exports = new AnalysisWorker();

