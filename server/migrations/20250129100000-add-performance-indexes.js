'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем индексы для оптимизации запросов
    
    // Проверяем существование таблиц перед добавлением индексов
    const tables = await queryInterface.showAllTables();
    console.log('Existing tables:', tables);
    
    // Функция для безопасного добавления индекса
    const safeAddIndex = async (tableName, columns, indexName) => {
      try {
        await queryInterface.addIndex(tableName, columns, { name: indexName });
        console.log(`✅ Added index ${indexName} on ${tableName}`);
      } catch (error) {
        if (error.message.includes('уже существует') || error.message.includes('already exists')) {
          console.log(`ℹ️  Index ${indexName} already exists, skipping`);
        } else {
          console.error(`❌ Error adding index ${indexName}:`, error.message);
        }
      }
    };

    // Индекс для поиска игровых комнат по типу и статусу
    if (tables.includes('GameRooms') || tables.includes('game_rooms')) {
      const tableName = tables.includes('GameRooms') ? 'GameRooms' : 'game_rooms';
      await safeAddIndex(tableName, ['gameType', 'status'], 'idx_gamerooms_type_status');
    }
    
    // Индекс для поиска событий по пользователю
    if (tables.includes('Events') || tables.includes('events')) {
      const tableName = tables.includes('Events') ? 'Events' : 'events';
      await safeAddIndex(tableName, ['userId'], 'idx_events_user');
    }
    
    // Индекс для поиска пар по пользователям
    if (tables.includes('Pairs') || tables.includes('pairs')) {
      const tableName = tables.includes('Pairs') ? 'Pairs' : 'pairs';
      await safeAddIndex(tableName, ['user1Id', 'user2Id', 'status'], 'idx_pairs_users_status');
    }
    
    // Индекс для поиска уроков по дате (только если таблица существует)
    if (tables.includes('PairDailyLessons') || tables.includes('pair_daily_lessons')) {
      const tableName = tables.includes('PairDailyLessons') ? 'PairDailyLessons' : 'pair_daily_lessons';
      await safeAddIndex(tableName, ['relationship_id', 'date'], 'idx_pair_lessons_date');
    }
    
    // Индекс для прогресса уроков (только если таблица существует)
    if (tables.includes('UserLessonProgresses') || tables.includes('user_lesson_progresses')) {
      const tableName = tables.includes('UserLessonProgresses') ? 'UserLessonProgresses' : 'user_lesson_progresses';
      await safeAddIndex(tableName, ['userId', 'lessonId'], 'idx_user_lesson_progress');
    }
    
    // Композитный индекс для медиафайлов
    if (tables.includes('Media') || tables.includes('media')) {
      const tableName = tables.includes('Media') ? 'Media' : 'media';
      await safeAddIndex(tableName, ['eventId'], 'idx_media_event');
    }
  },

  async down(queryInterface, Sequelize) {
    // Функция для безопасного удаления индекса
    const safeRemoveIndex = async (tableName, indexName) => {
      try {
        await queryInterface.removeIndex(tableName, indexName);
        console.log(`✅ Removed index ${indexName} from ${tableName}`);
      } catch (error) {
        console.log(`ℹ️  Index ${indexName} doesn't exist or already removed, skipping`);
      }
    };

    // Удаляем добавленные индексы (игнорируем ошибки если индекса не существует)
    const tables = await queryInterface.showAllTables();
    
    if (tables.includes('GameRooms') || tables.includes('game_rooms')) {
      const tableName = tables.includes('GameRooms') ? 'GameRooms' : 'game_rooms';
      await safeRemoveIndex(tableName, 'idx_gamerooms_type_status');
    }
    
    if (tables.includes('Events') || tables.includes('events')) {
      const tableName = tables.includes('Events') ? 'Events' : 'events';
      await safeRemoveIndex(tableName, 'idx_events_user');
    }
    
    if (tables.includes('Pairs') || tables.includes('pairs')) {
      const tableName = tables.includes('Pairs') ? 'Pairs' : 'pairs';
      await safeRemoveIndex(tableName, 'idx_pairs_users_status');
    }
    
    if (tables.includes('PairDailyLessons') || tables.includes('pair_daily_lessons')) {
      const tableName = tables.includes('PairDailyLessons') ? 'PairDailyLessons' : 'pair_daily_lessons';
      await safeRemoveIndex(tableName, 'idx_pair_lessons_date');
    }
    
    if (tables.includes('UserLessonProgresses') || tables.includes('user_lesson_progresses')) {
      const tableName = tables.includes('UserLessonProgresses') ? 'UserLessonProgresses' : 'user_lesson_progresses';
      await safeRemoveIndex(tableName, 'idx_user_lesson_progress');
    }
    
    if (tables.includes('Media') || tables.includes('media')) {
      const tableName = tables.includes('Media') ? 'Media' : 'media';
      await safeRemoveIndex(tableName, 'idx_media_event');
    }
  }
};
