'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('model_metadata', {
      model_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        comment: 'Уникальный ID модели'
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Версия модели'
      },
      type: {
        type: Sequelize.ENUM('collaborative_filtering', 'content_based', 'hybrid', 'deep_learning', 'similarity_analysis'),
        allowNull: false,
        comment: 'Тип модели'
      },
      status: {
        type: Sequelize.ENUM('development', 'testing', 'production', 'deprecated'),
        allowNull: false,
        defaultValue: 'development',
        comment: 'Статус модели'
      },
      trained_on: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Данные для обучения: количество пользователей, пар, взаимодействий'
      },
      metrics: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Метрики качества: accuracy, precision, recall, f1_score'
      },
      hyperparameters: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Гиперпараметры модели'
      },
      feature_importance: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Важность признаков'
      },
      training_time: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Время обучения в секундах'
      },
      model_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Размер модели в байтах'
      },
      last_trained: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Дата последнего обучения'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    }, {
      indexes: [
        {
          fields: ['type'],
          name: 'idx_model_metadata_type'
        },
        {
          fields: ['status'],
          name: 'idx_model_metadata_status'
        },
        {
          fields: ['version'],
          name: 'idx_model_metadata_version'
        },
        {
          fields: ['last_trained'],
          name: 'idx_model_metadata_trained'
        }
      ]
    });

    // Добавляем начальные записи для моделей
    await queryInterface.bulkInsert('model_metadata', [
      {
        model_id: 'gift_recommender_v1',
        version: '1.0.0',
        type: 'collaborative_filtering',
        status: 'development',
        trained_on: JSON.stringify({
          users_count: 0,
          interactions_count: 0,
          products_count: 0
        }),
        metrics: JSON.stringify({
          accuracy: 0.0,
          precision: 0.0,
          recall: 0.0,
          f1_score: 0.0
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        model_id: 'date_recommender_v1',
        version: '1.0.0',
        type: 'content_based',
        status: 'development',
        trained_on: JSON.stringify({
          places_count: 0,
          events_count: 0,
          user_preferences_count: 0
        }),
        metrics: JSON.stringify({
          accuracy: 0.0,
          user_satisfaction: 0.0
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        model_id: 'compatibility_analyzer_v1',
        version: '1.0.0',
        type: 'similarity_analysis',
        status: 'development',
        trained_on: JSON.stringify({
          pairs_count: 0,
          features_count: 0,
          interactions_count: 0
        }),
        metrics: JSON.stringify({
          accuracy: 0.0,
          correlation: 0.0
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('model_metadata');
  }
};
