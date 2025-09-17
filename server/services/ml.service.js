const clickhouseService = require('./clickhouse.service');
const { Interest } = require('../models');

class MLService {
  
  constructor() {
    // Кеш для категорий интересов
    this.interestCategoryCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheUpdateInterval = 1000 * 60 * 60; // 1 час
  }

  /**
   * Обновить эмбеддинг пользователя в реальном времени
   */
  async updateUserEmbeddingRealtime(userId) {
    try {
      console.log(`🧠 Updating embedding for user ${userId}...`);
      
      // Получаем последние предпочтения пользователя
      const preferences = await clickhouseService.getUserPreferences(userId);
      
      if (preferences.length === 0) {
        console.log(`ℹ️ No preferences found for user ${userId}`);
        return null;
      }
      
      // Генерируем эмбеддинг из предпочтений
      const embedding = await this.generateEmbeddingFromPreferences(preferences);
      
      // Сохраняем в ClickHouse
      await clickhouseService.updateUserEmbedding(userId, embedding, 'v1.0');
      
      console.log(`✅ Updated embedding for user ${userId} (${preferences.length} preferences)`);
      return embedding;
      
    } catch (error) {
      console.error(`❌ Failed to update embedding for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Генерация эмбеддинга из предпочтений пользователя
   */
  async generateEmbeddingFromPreferences(preferences) {
    try {
      // Обновляем кеш категорий если нужно
      await this.updateInterestCategoryCache();
      
      // Создаем 128-мерный вектор (можно увеличить для лучшей точности)
      const embeddingSize = 128;
      const embedding = new Array(embeddingSize).fill(0);
      
      // Веса для разных типов интересов
      const categoryWeights = this.getCategoryWeights();
      
      // Обрабатываем каждое предпочтение
      preferences.forEach(pref => {
        const category = this.interestCategoryCache.get(pref.interest_id) || 'other';
        const categoryWeight = categoryWeights[category] || 1.0;
        
        // Вычисляем индексы для размещения в векторе
        const indices = this.getEmbeddingIndices(pref.interest_id, category, embeddingSize);
        
        // Рассчитываем силу сигнала
        const signal = pref.current_rating * pref.confidence * categoryWeight;
        
        // Добавляем в эмбеддинг
        indices.forEach(index => {
          embedding[index] += signal;
        });
      });
      
      // Нормализуем вектор
      const normalizedEmbedding = this.normalizeVector(embedding);
      
      // Добавляем шум для избежания переобучения
      const noisyEmbedding = this.addNoise(normalizedEmbedding, 0.01);
      
      return noisyEmbedding;
      
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      throw error;
    }
  }
  
  /**
   * Обновление кеша категорий интересов
   */
  async updateInterestCategoryCache() {
    const now = Date.now();
    if (this.lastCacheUpdate && (now - this.lastCacheUpdate) < this.cacheUpdateInterval) {
      return; // Кеш еще актуален
    }
    
    try {
      const interests = await Interest.findAll({
        where: { is_active: true },
        attributes: ['id', 'category']
      });
      
      this.interestCategoryCache.clear();
      interests.forEach(interest => {
        this.interestCategoryCache.set(interest.id, interest.category);
      });
      
      this.lastCacheUpdate = now;
      console.log(`✅ Updated interest category cache (${interests.length} interests)`);
      
    } catch (error) {
      console.error('❌ Failed to update interest category cache:', error);
    }
  }
  
  /**
   * Получить веса категорий для эмбеддингов
   */
  getCategoryWeights() {
    return {
      'food': 1.2,           // Еда - важная категория
      'travel': 1.3,         // Путешествия - очень важно для пар
      'sport': 1.1,          // Спорт
      'music': 1.2,          // Музыка
      'cinema': 1.1,         // Кино
      'hobby': 1.0,          // Хобби
      'art': 1.0,            // Искусство
      'books': 1.0,          // Книги
      'games': 0.9,          // Игры - менее важно для совместимости
      'nature': 1.2,         // Природа
      'technology': 0.8,     // Технологии
      'fashion': 0.9,        // Мода
      'cooking': 1.2,        // Готовка
      'fitness': 1.1,        // Фитнес
      'photography': 1.0,    // Фотография
      'dancing': 1.3,        // Танцы - отлично для пар
      'shopping': 0.8,       // Шоппинг
      'animals': 1.1,        // Животные
      'cars': 0.9,           // Машины
      'crafts': 1.0,         // Рукоделие
      'education': 1.0,      // Образование
      'volunteering': 1.2,   // Волонтерство
      'other': 0.7           // Остальное
    };
  }
  
  /**
   * Получить индексы в эмбеддинге для интереса
   */
  getEmbeddingIndices(interestId, category, embeddingSize) {
    const indices = [];
    
    // Основной индекс по хешу ID интереса
    const primaryIndex = this.hashToIndex(interestId, embeddingSize);
    indices.push(primaryIndex);
    
    // Дополнительные индексы по категории
    const categoryIndex = this.hashToIndex(category, embeddingSize);
    indices.push(categoryIndex);
    
    // Смешанный индекс
    const mixedIndex = this.hashToIndex(interestId + category, embeddingSize);
    indices.push(mixedIndex);
    
    return indices;
  }
  
  /**
   * Хеш строки в индекс массива
   */
  hashToIndex(str, maxIndex) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % maxIndex;
  }
  
  /**
   * Нормализация вектора
   */
  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) {
      return vector; // Избегаем деления на ноль
    }
    return vector.map(val => val / magnitude);
  }
  
  /**
   * Добавление шума к вектору
   */
  addNoise(vector, noiseLevel = 0.01) {
    return vector.map(val => {
      const noise = (Math.random() - 0.5) * 2 * noiseLevel;
      return val + noise;
    });
  }
  
  /**
   * Вычисление сходства между пользователями
   */
  async calculateUserSimilarity(userId1, userId2) {
    try {
      const [embedding1, embedding2] = await Promise.all([
        clickhouseService.getUserEmbedding(userId1),
        clickhouseService.getUserEmbedding(userId2)
      ]);
      
      if (!embedding1 || !embedding2) {
        return null;
      }
      
      const similarity = clickhouseService.cosineSimilarity(
        embedding1.embedding_vector,
        embedding2.embedding_vector
      );
      
      return {
        similarity,
        user1_model: embedding1.model_version,
        user2_model: embedding2.model_version,
        calculated_at: new Date()
      };
      
    } catch (error) {
      console.error(`❌ Failed to calculate similarity between ${userId1} and ${userId2}:`, error);
      return null;
    }
  }
  
  /**
   * Рекомендации интересов для пользователя на основе похожих пользователей
   */
  async recommendInterests(userId, limit = 10) {
    try {
      // Находим похожих пользователей
      const similarUsers = await clickhouseService.findSimilarUsers(userId, 20);
      
      if (similarUsers.length === 0) {
        return [];
      }
      
      // Получаем интересы похожих пользователей
      const interestScores = new Map();
      
      for (const similarUser of similarUsers.slice(0, 5)) { // Берем топ 5
        const preferences = await clickhouseService.getUserPreferences(similarUser.user_id);
        
        preferences.forEach(pref => {
          const currentScore = interestScores.get(pref.interest_id) || 0;
          const weightedScore = pref.current_rating * similarUser.similarity;
          interestScores.set(pref.interest_id, currentScore + weightedScore);
        });
      }
      
      // Получаем текущие интересы пользователя для фильтрации
      const userInterests = await clickhouseService.getUserPreferences(userId);
      const userInterestIds = new Set(userInterests.map(p => p.interest_id));
      
      // Сортируем и фильтруем рекомендации
      const recommendations = Array.from(interestScores.entries())
        .filter(([interestId]) => !userInterestIds.has(interestId))
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
        .slice(0, limit)
        .map(([interestId, score]) => ({
          interest_id: interestId,
          predicted_rating: score,
          recommendation_type: 'collaborative_filtering'
        }));
      
      return recommendations;
      
    } catch (error) {
      console.error(`❌ Failed to recommend interests for user ${userId}:`, error);
      return [];
    }
  }
  
  /**
   * Batch обновление эмбеддингов для множества пользователей
   */
  async batchUpdateEmbeddings(userIds) {
    console.log(`🧠 Starting batch embedding update for ${userIds.length} users...`);
    
    let updated = 0;
    let failed = 0;
    
    for (const userId of userIds) {
      try {
        await this.updateUserEmbeddingRealtime(userId);
        updated++;
        
        // Пауза между обновлениями
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to update embedding for user ${userId}:`, error);
        failed++;
      }
    }
    
    console.log(`✅ Batch embedding update completed: ${updated} updated, ${failed} failed`);
    return { updated, failed };
  }
  
  /**
   * Анализ качества эмбеддингов
   */
  async analyzeEmbeddingQuality() {
    try {
      const { clickhouse } = require('../config/clickhouse');
      
      const result = await clickhouse.query({
        query: `
          SELECT 
            count() as total_embeddings,
            uniq(user_id) as unique_users,
            avg(arraySum(x -> x * x, embedding_vector)) as avg_magnitude,
            count() / uniq(user_id) as avg_versions_per_user
          FROM user_embeddings
        `,
        format: 'JSONEachRow'
      });
      
      const stats = await result.json();
      
      if (stats.length > 0) {
        console.log('📊 Embedding Quality Analysis:');
        console.log(`   Total embeddings: ${stats[0].total_embeddings}`);
        console.log(`   Unique users: ${stats[0].unique_users}`);
        console.log(`   Average magnitude: ${stats[0].avg_magnitude?.toFixed(4)}`);
        console.log(`   Avg versions per user: ${stats[0].avg_versions_per_user?.toFixed(2)}`);
      }
      
      return stats[0] || null;
      
    } catch (error) {
      console.error('❌ Failed to analyze embedding quality:', error);
      return null;
    }
  }
}

module.exports = new MLService();

