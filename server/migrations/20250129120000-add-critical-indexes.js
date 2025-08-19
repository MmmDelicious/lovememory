'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Индексы для Gift модели (частые запросы по пользователям и дате)
    await queryInterface.addIndex('Gifts', ['toUserId'], {
      name: 'idx_gifts_to_user_id'
    });
    await queryInterface.addIndex('Gifts', ['fromUserId'], {
      name: 'idx_gifts_from_user_id'
    });
    await queryInterface.addIndex('Gifts', ['toUserId', 'isViewed'], {
      name: 'idx_gifts_to_user_viewed'
    });
    await queryInterface.addIndex('Gifts', ['createdAt'], {
      name: 'idx_gifts_created_at'
    });

    // Индексы для User модели
    await queryInterface.addIndex('Users', ['email'], {
      name: 'idx_users_email',
      unique: true
    });
    await queryInterface.addIndex('Users', ['googleId'], {
      name: 'idx_users_google_id',
      unique: true
    });
    await queryInterface.addIndex('Users', ['last_active'], {
      name: 'idx_users_last_active'
    });

    // Индексы для UserLessonProgress (частые запросы по пользователю и дате)
    await queryInterface.addIndex('UserLessonProgresses', ['user_id'], {
      name: 'idx_user_lesson_progress_user_id'
    });
    await queryInterface.addIndex('UserLessonProgresses', ['user_id', 'completed_at'], {
      name: 'idx_user_lesson_progress_user_date'
    });
    await queryInterface.addIndex('UserLessonProgresses', ['completed_at'], {
      name: 'idx_user_lesson_progress_completed_at'
    });

    // Индексы для Event модели
    await queryInterface.addIndex('Events', ['userId'], {
      name: 'idx_events_user_id'
    });
    await queryInterface.addIndex('Events', ['event_date'], {
      name: 'idx_events_event_date'
    });
    await queryInterface.addIndex('Events', ['userId', 'event_date'], {
      name: 'idx_events_user_date'
    });

    // Индексы для GameRoom модели
    await queryInterface.addIndex('GameRooms', ['status'], {
      name: 'idx_game_rooms_status'
    });
    await queryInterface.addIndex('GameRooms', ['gameType'], {
      name: 'idx_game_rooms_game_type'
    });
    await queryInterface.addIndex('GameRooms', ['hostUserId'], {
      name: 'idx_game_rooms_host_user_id'
    });
    await queryInterface.addIndex('GameRooms', ['status', 'gameType'], {
      name: 'idx_game_rooms_status_type'
    });

    // Индексы для Pair модели
    await queryInterface.addIndex('Pairs', ['user1Id'], {
      name: 'idx_pairs_user1_id'
    });
    await queryInterface.addIndex('Pairs', ['user2Id'], {
      name: 'idx_pairs_user2_id'
    });
    await queryInterface.addIndex('Pairs', ['status'], {
      name: 'idx_pairs_status'
    });
    await queryInterface.addIndex('Pairs', ['user1Id', 'user2Id', 'status'], {
      name: 'idx_pairs_users_status'
    });

    // Индексы для RelationshipMetrics модели
    await queryInterface.addIndex('RelationshipMetrics', ['pair_id'], {
      name: 'idx_relationship_metrics_pair_id'
    });
    await queryInterface.addIndex('RelationshipMetrics', ['updated_at'], {
      name: 'idx_relationship_metrics_updated_at'
    });

    console.log('✅ Critical database indexes have been added for performance optimization');
  },

  async down(queryInterface, Sequelize) {
    // Удаляем все созданные индексы в обратном порядке
    const indexesToDrop = [
      'idx_relationship_metrics_updated_at',
      'idx_relationship_metrics_pair_id',
      'idx_pairs_users_status',
      'idx_pairs_status',
      'idx_pairs_user2_id',
      'idx_pairs_user1_id',
      'idx_game_rooms_status_type',
      'idx_game_rooms_host_user_id',
      'idx_game_rooms_game_type',
      'idx_game_rooms_status',
      'idx_events_user_date',
      'idx_events_event_date',
      'idx_events_user_id',
      'idx_user_lesson_progress_completed_at',
      'idx_user_lesson_progress_user_date',
      'idx_user_lesson_progress_user_id',
      'idx_users_last_active',
      'idx_users_google_id',
      'idx_users_email',
      'idx_gifts_created_at',
      'idx_gifts_to_user_viewed',
      'idx_gifts_from_user_id',
      'idx_gifts_to_user_id'
    ];

    for (const indexName of indexesToDrop) {
      try {
        await queryInterface.removeIndex('Gifts', indexName);
      } catch (error) {
        // Индекс может не существовать, игнорируем ошибку
        console.log(`Index ${indexName} not found, skipping...`);
      }
    }

    console.log('✅ Database indexes have been removed');
  }
};
