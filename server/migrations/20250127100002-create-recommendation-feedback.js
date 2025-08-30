'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('recommendation_feedback', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      pair_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Pairs',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      entity_type: {
        type: Sequelize.ENUM(
          'place',           // Место (ресторан, кафе, парк)
          'activity',        // Активность (кино, театр, спорт)
          'event',           // Событие
          'insight',         // Инсайт/совет
          'date_idea',       // Идея свидания
          'gift',            // Подарок
          'lesson',          // Урок/задание
          'game',            // Игра
          'other'            // Другое
        ),
        allowNull: false,
      },
      entity_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      entity_data: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      value: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 10,
        },
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      recommendation_context: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      feedback_type: {
        type: Sequelize.ENUM('rating', 'visited', 'not_visited', 'cancelled'),
        allowNull: false,
        defaultValue: 'rating',
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      recommendation_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      visit_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    });

    // Создаем индексы
    await queryInterface.addIndex('recommendation_feedback', ['user_id'], {
      name: 'idx_feedback_user'
    });

    await queryInterface.addIndex('recommendation_feedback', ['pair_id'], {
      name: 'idx_feedback_pair'
    });

    await queryInterface.addIndex('recommendation_feedback', ['entity_type'], {
      name: 'idx_feedback_entity_type'
    });

    await queryInterface.addIndex('recommendation_feedback', ['entity_id'], {
      name: 'idx_feedback_entity_id'
    });

    await queryInterface.addIndex('recommendation_feedback', ['value'], {
      name: 'idx_feedback_value'
    });

    await queryInterface.addIndex('recommendation_feedback', ['feedback_type'], {
      name: 'idx_feedback_type'
    });

    await queryInterface.addIndex('recommendation_feedback', ['submitted_at'], {
      name: 'idx_feedback_submitted'
    });

    await queryInterface.addIndex('recommendation_feedback', ['pair_id', 'entity_type', 'submitted_at'], {
      name: 'idx_feedback_pair_type_date'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('recommendation_feedback');
  }
};
