const { clickhouse } = require('../config/clickhouse');

class ClickHouseService {
  
  /**
   * Записать событие интереса пользователя
   */
  async logInterestEvent(data) {
    const {
      userId,
      interestId,
      eventType,
      oldRating = null,
      newRating = null,
      confidence = 1.0,
      sessionId,
      source = 'profile',
      metadata = {}
    } = data;

    try {
      await clickhouse.insert({
        table: 'user_interest_events',
        values: [{
          user_id: userId,
          interest_id: interestId,
          event_type: eventType,
          old_rating: oldRating,
          new_rating: newRating,
          confidence: confidence,
          timestamp: new Date(),
          session_id: sessionId,
          source: source,
          metadata: JSON.stringify(metadata)
        }],
        format: 'JSONEachRow'
      });

      // Обновляем кеш текущих предпочтений
      if (newRating !== null) {
        await this.updateCurrentPreference(userId, interestId, newRating, confidence, source);
      }

      console.log('✅ Interest event logged to ClickHouse');
    } catch (error) {
      console.error('❌ Failed to log interest event:', error);
      throw error;
    }
  }

  /**
   * Обновить текущие предпочтения пользователя (кеш)
   */
  async updateCurrentPreference(userId, interestId, rating, confidence, source) {
    try {
      await clickhouse.insert({
        table: 'user_current_preferences',
        values: [{
          user_id: userId,
          interest_id: interestId,
          current_rating: rating,
          confidence: confidence,
          last_updated: new Date(),
          interaction_count: 1, // будет агрегироваться автоматически
          source: source
        }],
        format: 'JSONEachRow'
      });
    } catch (error) {
      console.error('❌ Failed to update current preference:', error);
      // Не бросаем ошибку, так как это кеш
    }
  }

  /**
   * Получить текущие предпочтения пользователя
   */
  async getUserPreferences(userId, limit = 100) {
    try {
      const result = await clickhouse.query({
        query: `
          SELECT 
            interest_id,
            current_rating,
            confidence,
            last_updated,
            interaction_count,
            source
          FROM user_current_preferences
          WHERE user_id = {userId:String}
          ORDER BY current_rating DESC
          LIMIT {limit:UInt32}
        `,
        query_params: { userId, limit },
        format: 'JSONEachRow'
      });

      return await result.json();
    } catch (error) {
      console.error('❌ Failed to get user preferences:', error);
      return [];
    }
  }

  /**
   * Получить детальную историю интересов пользователя
   */
  async getUserInterestHistory(userId, interestId = null, limit = 100) {
    try {
      let query = `
        SELECT 
          user_id,
          interest_id,
          event_type,
          old_rating,
          new_rating,
          confidence,
          timestamp,
          session_id,
          source,
          metadata
        FROM user_interest_events
        WHERE user_id = {userId:String}
      `;
      
      const params = { userId, limit };
      
      if (interestId) {
        query += ` AND interest_id = {interestId:String}`;
        params.interestId = interestId;
      }
      
      query += ` ORDER BY timestamp DESC LIMIT {limit:UInt32}`;

      const result = await clickhouse.query({
        query,
        query_params: params,
        format: 'JSONEachRow'
      });

      return await result.json();
    } catch (error) {
      console.error('❌ Failed to get user interest history:', error);
      return [];
    }
  }

  /**
   * Обновить эмбеддинг пользователя
   */
  async updateUserEmbedding(userId, embedding, modelVersion = 'v1') {
    try {
      await clickhouse.insert({
        table: 'user_embeddings',
        values: [{
          user_id: userId,
          embedding_vector: embedding,
          model_version: modelVersion,
          created_at: new Date(),
          features_hash: this.generateFeaturesHash(embedding)
        }],
        format: 'JSONEachRow'
      });

      console.log('✅ User embedding updated');
    } catch (error) {
      console.error('❌ Failed to update embedding:', error);
      throw error;
    }
  }

  /**
   * Получить эмбеддинг пользователя
   */
  async getUserEmbedding(userId, modelVersion = null) {
    try {
      let query = `
        SELECT 
          embedding_vector,
          model_version,
          created_at,
          features_hash
        FROM user_embeddings
        WHERE user_id = {userId:String}
      `;
      
      const params = { userId };
      
      if (modelVersion) {
        query += ` AND model_version = {modelVersion:String}`;
        params.modelVersion = modelVersion;
      }
      
      query += ` ORDER BY created_at DESC LIMIT 1`;

      const result = await clickhouse.query({
        query,
        query_params: params,
        format: 'JSONEachRow'
      });

      const data = await result.json();
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('❌ Failed to get user embedding:', error);
      return null;
    }
  }

  /**
   * Логирование рекомендаций
   */
  async logRecommendationEvent(data) {
    const {
      userId,
      itemId,
      itemType,
      action,
      predictedRating,
      actualRating = null,
      modelVersion = 'v1',
      sessionId,
      context = {}
    } = data;

    try {
      await clickhouse.insert({
        table: 'recommendation_events',
        values: [{
          user_id: userId,
          item_id: itemId,
          item_type: itemType,
          action: action,
          predicted_rating: predictedRating,
          actual_rating: actualRating,
          model_version: modelVersion,
          timestamp: new Date(),
          session_id: sessionId,
          context: JSON.stringify(context)
        }],
        format: 'JSONEachRow'
      });

      console.log('✅ Recommendation event logged');
    } catch (error) {
      console.error('❌ Failed to log recommendation:', error);
      throw error;
    }
  }

  /**
   * Получить данные для обучения модели
   */
  async getTrainingData(limit = 10000) {
    try {
      const result = await clickhouse.query({
        query: `
          SELECT 
            user_id,
            item_id,
            item_type,
            actual_rating,
            predicted_rating,
            context,
            timestamp
          FROM recommendation_events
          WHERE actual_rating IS NOT NULL
          ORDER BY timestamp DESC
          LIMIT {limit:UInt32}
        `,
        query_params: { limit },
        format: 'JSONEachRow'
      });

      return await result.json();
    } catch (error) {
      console.error('❌ Failed to get training data:', error);
      return [];
    }
  }

  /**
   * Логирование общей активности
   */
  async logActivity(data) {
    const {
      userId,
      action,
      entityType,
      entityId,
      sessionId,
      ipAddress = '',
      userAgent = '',
      metadata = {}
    } = data;

    try {
      await clickhouse.insert({
        table: 'activity_logs',
        values: [{
          user_id: userId,
          action: action,
          entity_type: entityType,
          entity_id: entityId,
          timestamp: new Date(),
          session_id: sessionId,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: JSON.stringify(metadata)
        }],
        format: 'JSONEachRow'
      });

      console.log('✅ Activity logged');
    } catch (error) {
      console.error('❌ Failed to log activity:', error);
      // Не бросаем ошибку для логирования
    }
  }

  /**
   * Получить статистику пользователя
   */
  async getUserStats(userId) {
    try {
      const result = await clickhouse.query({
        query: `
          SELECT 
            user_id,
            interest_id,
            current_rating,
            total_interactions,
            rating_count,
            last_interaction,
            avg_rating
          FROM user_interest_stats
          WHERE user_id = {userId:String}
          ORDER BY current_rating DESC
        `,
        query_params: { userId },
        format: 'JSONEachRow'
      });

      return await result.json();
    } catch (error) {
      console.error('❌ Failed to get user stats:', error);
      return [];
    }
  }

  /**
   * Получить топ интересы по популярности
   */
  async getTopInterests(limit = 50, days = 30) {
    try {
      const result = await clickhouse.query({
        query: `
          SELECT 
            interest_id,
            sum(interactions) as total_interactions,
            uniq(user_id) as unique_users,
            avg(avg_rating) as overall_rating
          FROM interest_popularity_daily
          WHERE date >= today() - {days:UInt32}
          GROUP BY interest_id
          ORDER BY total_interactions DESC
          LIMIT {limit:UInt32}
        `,
        query_params: { limit, days },
        format: 'JSONEachRow'
      });

      return await result.json();
    } catch (error) {
      console.error('❌ Failed to get top interests:', error);
      return [];
    }
  }

  /**
   * Получить аналитику активности пользователя
   */
  async getUserActivityAnalytics(userId, days = 30) {
    try {
      const result = await clickhouse.query({
        query: `
          SELECT 
            date,
            total_events,
            unique_interests,
            sessions_count
          FROM daily_user_activity
          WHERE user_id = {userId:String}
            AND date >= today() - {days:UInt32}
          ORDER BY date DESC
        `,
        query_params: { userId, days },
        format: 'JSONEachRow'
      });

      return await result.json();
    } catch (error) {
      console.error('❌ Failed to get user activity analytics:', error);
      return [];
    }
  }

  /**
   * Поиск похожих пользователей по эмбеддингам
   */
  async findSimilarUsers(userId, limit = 10) {
    try {
      // Сначала получаем эмбеддинг пользователя
      const userEmbedding = await this.getUserEmbedding(userId);
      if (!userEmbedding) {
        return [];
      }

      // Поиск похожих пользователей через косинусное сходство
      // Это упрощенная версия, в реальности лучше использовать более эффективные алгоритмы
      const result = await clickhouse.query({
        query: `
          SELECT 
            user_id,
            embedding_vector,
            model_version,
            created_at
          FROM user_embeddings
          WHERE user_id != {userId:String}
            AND model_version = {modelVersion:String}
          ORDER BY created_at DESC
          LIMIT {limit:UInt32}
        `,
        query_params: { 
          userId, 
          modelVersion: userEmbedding.model_version,
          limit: limit * 2 // берем больше для фильтрации
        },
        format: 'JSONEachRow'
      });

      const candidates = await result.json();
      
      // Вычисляем косинусное сходство (упрощенно)
      const similarities = candidates.map(candidate => {
        const similarity = this.cosineSimilarity(
          userEmbedding.embedding_vector, 
          candidate.embedding_vector
        );
        return {
          user_id: candidate.user_id,
          similarity: similarity,
          model_version: candidate.model_version
        };
      });

      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    } catch (error) {
      console.error('❌ Failed to find similar users:', error);
      return [];
    }
  }

  /**
   * Батчевая вставка событий интересов
   */
  async batchLogInterestEvents(events) {
    try {
      const values = events.map(event => ({
        user_id: event.userId,
        interest_id: event.interestId,
        event_type: event.eventType,
        old_rating: event.oldRating || null,
        new_rating: event.newRating || null,
        confidence: event.confidence || 1.0,
        timestamp: event.timestamp || new Date(),
        session_id: event.sessionId,
        source: event.source || 'batch',
        metadata: JSON.stringify(event.metadata || {})
      }));

      await clickhouse.insert({
        table: 'user_interest_events',
        values: values,
        format: 'JSONEachRow'
      });

      console.log(`✅ Batch logged ${events.length} interest events`);
    } catch (error) {
      console.error('❌ Failed to batch log interest events:', error);
      throw error;
    }
  }

  // Утилитарные методы

  generateFeaturesHash(embedding) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(JSON.stringify(embedding)).digest('hex');
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Проверка здоровья ClickHouse
   */
  async healthCheck() {
    try {
      const result = await clickhouse.query({
        query: 'SELECT 1 as health',
        format: 'JSONEachRow'
      });
      
      await result.json();
      return { status: 'healthy', timestamp: new Date() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: new Date() 
      };
    }
  }
}

module.exports = new ClickHouseService();

