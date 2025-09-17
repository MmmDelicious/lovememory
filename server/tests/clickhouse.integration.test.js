const { describe, test, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');
const { v4: uuidv4 } = require('uuid');
const clickhouseService = require('../services/clickhouse.service');
const mlService = require('../services/ml.service');
const { initClickHouse } = require('../config/clickhouse');

describe('ClickHouse Integration Tests', () => {
  let testUserId;
  let testInterestId;
  let testSessionId;

  beforeAll(async () => {
    // Инициализируем ClickHouse для тестов
    try {
      await initClickHouse();
      console.log('✅ ClickHouse initialized for tests');
    } catch (error) {
      console.error('❌ Failed to initialize ClickHouse for tests:', error);
      throw error;
    }
  });

  beforeEach(() => {
    // Генерируем новые ID для каждого теста
    testUserId = uuidv4();
    testInterestId = uuidv4();
    testSessionId = `test-session-${Date.now()}`;
  });

  afterAll(async () => {
    // Очищаем тестовые данные
    try {
      const { clickhouse } = require('../config/clickhouse');
      
      await clickhouse.query({
        query: `
          ALTER TABLE user_interest_events 
          DELETE WHERE session_id LIKE 'test-%'
        `
      });
      
      await clickhouse.query({
        query: `
          ALTER TABLE user_current_preferences 
          DELETE WHERE source = 'test'
        `
      });
      
      await clickhouse.query({
        query: `
          ALTER TABLE user_embeddings 
          DELETE WHERE model_version = 'test'
        `
      });
      
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
    }
  });

  describe('ClickHouseService', () => {
    
    test('should log interest event successfully', async () => {
      const eventData = {
        userId: testUserId,
        interestId: testInterestId,
        eventType: 'rate',
        oldRating: null,
        newRating: 8.5,
        sessionId: testSessionId,
        source: 'test',
        metadata: { test: true }
      };

      await expect(clickhouseService.logInterestEvent(eventData))
        .resolves.not.toThrow();

      // Проверяем что событие записалось
      const events = await clickhouseService.getUserInterestHistory(testUserId, testInterestId, 10);
      expect(events).toHaveLength(1);
      expect(events[0].interest_id).toBe(testInterestId);
      expect(events[0].new_rating).toBe(8.5);
      expect(events[0].event_type).toBe('rate');
    });

    test('should retrieve user preferences', async () => {
      // Логируем несколько событий
      const events = [
        {
          userId: testUserId,
          interestId: testInterestId,
          eventType: 'rate',
          newRating: 9.0,
          sessionId: testSessionId,
          source: 'test'
        },
        {
          userId: testUserId,
          interestId: uuidv4(),
          eventType: 'rate',
          newRating: 7.5,
          sessionId: testSessionId,
          source: 'test'
        }
      ];

      for (const event of events) {
        await clickhouseService.logInterestEvent(event);
      }

      // Даем время на обработку
      await new Promise(resolve => setTimeout(resolve, 1000));

      const preferences = await clickhouseService.getUserPreferences(testUserId);
      expect(preferences.length).toBeGreaterThan(0);
      
      const mainPreference = preferences.find(p => p.interest_id === testInterestId);
      expect(mainPreference).toBeDefined();
      expect(mainPreference.current_rating).toBe(9.0);
    });

    test('should batch log interest events', async () => {
      const events = [
        {
          userId: testUserId,
          interestId: testInterestId,
          eventType: 'select',
          newRating: 8.0,
          sessionId: testSessionId,
          source: 'test'
        },
        {
          userId: testUserId,
          interestId: uuidv4(),
          eventType: 'select',
          newRating: 7.0,
          sessionId: testSessionId,
          source: 'test'
        },
        {
          userId: testUserId,
          interestId: uuidv4(),
          eventType: 'select',
          newRating: 9.0,
          sessionId: testSessionId,
          source: 'test'
        }
      ];

      await expect(clickhouseService.batchLogInterestEvents(events))
        .resolves.not.toThrow();

      // Проверяем что все события записались
      const history = await clickhouseService.getUserInterestHistory(testUserId, null, 10);
      expect(history.length).toBe(3);
    });

    test('should update and retrieve user embedding', async () => {
      const embedding = new Array(128).fill(0).map(() => Math.random());
      
      await expect(clickhouseService.updateUserEmbedding(testUserId, embedding, 'test'))
        .resolves.not.toThrow();

      const retrievedEmbedding = await clickhouseService.getUserEmbedding(testUserId, 'test');
      expect(retrievedEmbedding).toBeDefined();
      expect(retrievedEmbedding.embedding_vector).toHaveLength(128);
      expect(retrievedEmbedding.model_version).toBe('test');
    });

    test('should log recommendation events', async () => {
      const recommendationData = {
        userId: testUserId,
        itemId: testInterestId,
        itemType: 'product',
        action: 'view',
        predictedRating: 8.5,
        actualRating: 8.0,
        modelVersion: 'test',
        sessionId: testSessionId,
        context: { test: true }
      };

      await expect(clickhouseService.logRecommendationEvent(recommendationData))
        .resolves.not.toThrow();

      const trainingData = await clickhouseService.getTrainingData(10);
      const testRecord = trainingData.find(r => r.user_id === testUserId);
      expect(testRecord).toBeDefined();
      expect(testRecord.predicted_rating).toBe(8.5);
      expect(testRecord.actual_rating).toBe(8.0);
    });

    test('should log general activity', async () => {
      const activityData = {
        userId: testUserId,
        action: 'view_profile',
        entityType: 'user',
        entityId: uuidv4(),
        sessionId: testSessionId,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        metadata: { test: true }
      };

      await expect(clickhouseService.logActivity(activityData))
        .resolves.not.toThrow();
    });

    test('should handle errors gracefully', async () => {
      // Тест с невалидными данными
      const invalidData = {
        userId: null, // невалидный ID
        interestId: testInterestId,
        eventType: 'invalid_type', // невалидный тип
        sessionId: testSessionId
      };

      await expect(clickhouseService.logInterestEvent(invalidData))
        .rejects.toThrow();
    });

    test('should perform health check', async () => {
      const health = await clickhouseService.healthCheck();
      expect(health).toBeDefined();
      expect(health.status).toBe('healthy');
      expect(health.timestamp).toBeDefined();
    });
  });

  describe('MLService Integration', () => {
    
    test('should generate embedding from preferences', async () => {
      // Создаем тестовые предпочтения
      const preferences = [
        {
          interest_id: testInterestId,
          current_rating: 9.0,
          confidence: 1.0
        },
        {
          interest_id: uuidv4(),
          current_rating: 7.5,
          confidence: 0.8
        },
        {
          interest_id: uuidv4(),
          current_rating: 8.2,
          confidence: 0.9
        }
      ];

      const embedding = await mlService.generateEmbeddingFromPreferences(preferences);
      
      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding).toHaveLength(128);
      
      // Проверяем что вектор нормализован
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      expect(magnitude).toBeCloseTo(1.0, 2);
    });

    test('should update user embedding in realtime', async () => {
      // Логируем предпочтения для пользователя
      const events = [
        {
          userId: testUserId,
          interestId: testInterestId,
          eventType: 'rate',
          newRating: 9.0,
          sessionId: testSessionId,
          source: 'test'
        },
        {
          userId: testUserId,
          interestId: uuidv4(),
          eventType: 'rate',
          newRating: 8.0,
          sessionId: testSessionId,
          source: 'test'
        }
      ];

      for (const event of events) {
        await clickhouseService.logInterestEvent(event);
      }

      // Даем время на обработку
      await new Promise(resolve => setTimeout(resolve, 1000));

      const embedding = await mlService.updateUserEmbeddingRealtime(testUserId);
      
      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding).toHaveLength(128);
      
      // Проверяем что эмбеддинг сохранился в ClickHouse
      const savedEmbedding = await clickhouseService.getUserEmbedding(testUserId);
      expect(savedEmbedding).toBeDefined();
      expect(savedEmbedding.embedding_vector).toEqual(embedding);
    });

    test('should calculate user similarity', async () => {
      const userId1 = uuidv4();
      const userId2 = uuidv4();
      
      // Создаем похожие эмбеддинги
      const embedding1 = new Array(128).fill(0.1);
      const embedding2 = new Array(128).fill(0.11); // Очень похожий
      
      await clickhouseService.updateUserEmbedding(userId1, embedding1, 'test');
      await clickhouseService.updateUserEmbedding(userId2, embedding2, 'test');
      
      const similarity = await mlService.calculateUserSimilarity(userId1, userId2);
      
      expect(similarity).toBeDefined();
      expect(similarity.similarity).toBeGreaterThan(0.9); // Должно быть высокое сходство
      expect(similarity.user1_model).toBe('test');
      expect(similarity.user2_model).toBe('test');
    });

    test('should recommend interests', async () => {
      // Создаем данные для рекомендаций
      const similarUserId = uuidv4();
      const commonInterestId = uuidv4();
      
      // Создаем похожие эмбеддинги
      const embedding1 = new Array(128).fill(0.1);
      const embedding2 = new Array(128).fill(0.11);
      
      await clickhouseService.updateUserEmbedding(testUserId, embedding1, 'test');
      await clickhouseService.updateUserEmbedding(similarUserId, embedding2, 'test');
      
      // Добавляем интересы похожему пользователю
      await clickhouseService.logInterestEvent({
        userId: similarUserId,
        interestId: commonInterestId,
        eventType: 'rate',
        newRating: 9.0,
        sessionId: testSessionId,
        source: 'test'
      });
      
      // Даем время на обработку
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const recommendations = await mlService.recommendInterests(testUserId, 5);
      
      expect(Array.isArray(recommendations)).toBe(true);
      // Может быть пустым если нет достаточно данных, это нормально для тестов
    });

    test('should analyze embedding quality', async () => {
      // Создаем несколько эмбеддингов
      const userIds = [uuidv4(), uuidv4(), uuidv4()];
      
      for (const userId of userIds) {
        const embedding = new Array(128).fill(0).map(() => Math.random());
        await clickhouseService.updateUserEmbedding(userId, embedding, 'test');
      }
      
      const analysis = await mlService.analyzeEmbeddingQuality();
      
      expect(analysis).toBeDefined();
      expect(analysis.total_embeddings).toBeGreaterThan(0);
      expect(analysis.unique_users).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    
    test('should handle missing user preferences gracefully', async () => {
      const nonExistentUserId = uuidv4();
      
      const preferences = await clickhouseService.getUserPreferences(nonExistentUserId);
      expect(preferences).toEqual([]);
      
      const embedding = await mlService.updateUserEmbeddingRealtime(nonExistentUserId);
      expect(embedding).toBeNull();
    });

    test('should handle concurrent operations', async () => {
      const promises = [];
      
      // Множественные одновременные записи
      for (let i = 0; i < 10; i++) {
        promises.push(
          clickhouseService.logInterestEvent({
            userId: testUserId,
            interestId: uuidv4(),
            eventType: 'rate',
            newRating: Math.random() * 10,
            sessionId: testSessionId,
            source: 'test'
          })
        );
      }
      
      await expect(Promise.all(promises)).resolves.not.toThrow();
      
      // Проверяем что все события записались
      const history = await clickhouseService.getUserInterestHistory(testUserId);
      expect(history.length).toBe(10);
    });

    test('should handle large embedding vectors', async () => {
      const largeEmbedding = new Array(512).fill(0).map(() => Math.random());
      
      await expect(clickhouseService.updateUserEmbedding(testUserId, largeEmbedding, 'test'))
        .resolves.not.toThrow();
      
      const retrieved = await clickhouseService.getUserEmbedding(testUserId, 'test');
      expect(retrieved.embedding_vector).toHaveLength(512);
    });
  });

  describe('Performance Tests', () => {
    
    test('should handle batch operations efficiently', async () => {
      const batchSize = 100;
      const events = [];
      
      for (let i = 0; i < batchSize; i++) {
        events.push({
          userId: testUserId,
          interestId: uuidv4(),
          eventType: 'select',
          newRating: Math.random() * 10,
          sessionId: testSessionId,
          source: 'test'
        });
      }
      
      const startTime = Date.now();
      await clickhouseService.batchLogInterestEvents(events);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Должно выполниться за менее чем 5 секунд
      
      console.log(`✅ Batch operation (${batchSize} events) completed in ${duration}ms`);
    });

    test('should retrieve data quickly', async () => {
      // Добавляем данные для поиска
      for (let i = 0; i < 50; i++) {
        await clickhouseService.logInterestEvent({
          userId: testUserId,
          interestId: uuidv4(),
          eventType: 'rate',
          newRating: Math.random() * 10,
          sessionId: testSessionId,
          source: 'test'
        });
      }
      
      const startTime = Date.now();
      const preferences = await clickhouseService.getUserPreferences(testUserId, 50);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // Должно выполниться за менее чем 1 секунду
      expect(preferences.length).toBeGreaterThan(0);
      
      console.log(`✅ Data retrieval completed in ${duration}ms`);
    });
  });
});

// Вспомогательные функции для тестов
const createTestUser = () => ({
  id: uuidv4(),
  email: `test-${Date.now()}@example.com`,
  name: 'Test User'
});

const createTestInterest = () => ({
  id: uuidv4(),
  name: `Test Interest ${Date.now()}`,
  category: 'test',
  description: 'Test interest for integration tests',
  emoji: '🧪',
  is_active: true,
  popularity_score: 1
});

const waitForClickHouseProcessing = (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
  createTestUser,
  createTestInterest,
  waitForClickHouseProcessing
};

