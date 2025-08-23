'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Создаем таблицу activity_log для event bus архитектуры
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      pair_id: {
        type: Sequelize.UUID,
        allowNull: true, // Может быть null для системных событий
        references: {
          model: 'Pairs',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true, // Может быть null для системных событий
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Тип действия: event_created, media_uploaded, game_started, etc.'
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Данные события в JSON формате'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Добавляем индексы для быстрого поиска и аналитики
    await queryInterface.addIndex('activity_logs', ['pair_id', 'created_at'], {
      name: 'idx_activity_logs_pair_created'
    });

    await queryInterface.addIndex('activity_logs', ['user_id', 'created_at'], {
      name: 'idx_activity_logs_user_created'
    });

    await queryInterface.addIndex('activity_logs', ['action'], {
      name: 'idx_activity_logs_action'
    });

    await queryInterface.addIndex('activity_logs', ['created_at'], {
      name: 'idx_activity_logs_created'
    });

    // GIN индекс для JSONB payload для быстрого поиска по содержимому
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_activity_logs_payload_gin 
      ON activity_logs USING GIN (payload);
    `);
  },

  async down (queryInterface, Sequelize) {
    // Удаляем GIN индекс
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_activity_logs_payload_gin;
    `);

    // Удаляем остальные индексы
    await queryInterface.removeIndex('activity_logs', 'idx_activity_logs_pair_created');
    await queryInterface.removeIndex('activity_logs', 'idx_activity_logs_user_created');
    await queryInterface.removeIndex('activity_logs', 'idx_activity_logs_action');
    await queryInterface.removeIndex('activity_logs', 'idx_activity_logs_created');
    
    // Удаляем таблицу
    await queryInterface.dropTable('activity_logs');
  }
};
