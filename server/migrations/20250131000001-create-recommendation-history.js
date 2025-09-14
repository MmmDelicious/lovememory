'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recommendation_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      pair_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'pairs',
          key: 'id'
        },
        comment: 'ID пары (может быть null для одиночных пользователей)'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'ID пользователя, которому показали рекомендацию'
      },
      rec_type: {
        type: Sequelize.ENUM('gift', 'date', 'lesson', 'activity', 'place'),
        allowNull: false,
        comment: 'Тип рекомендации'
      },
      rec_items: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'Список рекомендованных элементов с метаданными'
      },
      ranked_scores: {
        type: Sequelize.ARRAY(Sequelize.FLOAT),
        allowNull: true,
        comment: 'Ранжированные скоры для каждого элемента'
      },
      chosen_item_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID выбранного пользователем элемента'
      },
      feedback_rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 10
        },
        comment: 'Оценка пользователя (1-10)'
      },
      feedback_comment: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Комментарий пользователя к рекомендации'
      },
      model_version: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '1.0.0',
        comment: 'Версия модели, которая сгенерировала рекомендацию'
      },
      experiment_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID A/B эксперимента'
      },
      context: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Контекст рекомендации (бюджет, предпочтения, время)'
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
          fields: ['pair_id', 'created_at'],
          name: 'idx_recommendation_history_pair_created'
        },
        {
          fields: ['user_id', 'created_at'],
          name: 'idx_recommendation_history_user_created'
        },
        {
          fields: ['rec_type'],
          name: 'idx_recommendation_history_type'
        },
        {
          fields: ['model_version'],
          name: 'idx_recommendation_history_model'
        },
        {
          fields: ['experiment_id'],
          name: 'idx_recommendation_history_experiment'
        },
        {
          fields: ['feedback_rating'],
          name: 'idx_recommendation_history_rating'
        },
        {
          fields: ['chosen_item_id'],
          name: 'idx_recommendation_history_chosen'
        }
      ]
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('recommendation_history');
  }
};
