'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      pair_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Pairs',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      session_type: {
        type: Sequelize.ENUM('learning', 'gaming', 'discussion', 'exercise', 'meditation', 'planning', 'date', 'activity'),
        allowNull: false,
        defaultValue: 'activity'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'paused', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
      },
      quality_rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 10
        }
      },
      participants: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      goals: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      achievements: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Добавляем индексы
    await queryInterface.addIndex('sessions', ['pair_id']);
    await queryInterface.addIndex('sessions', ['session_type']);
    await queryInterface.addIndex('sessions', ['status']);
    await queryInterface.addIndex('sessions', ['started_at']);
    await queryInterface.addIndex('sessions', ['ended_at']);
    await queryInterface.addIndex('sessions', ['created_by_user_id']);
    await queryInterface.addIndex('sessions', ['pair_id', 'started_at']);
    await queryInterface.addIndex('sessions', ['pair_id', 'session_type']);
    await queryInterface.addIndex('sessions', {
      fields: ['metadata'],
      using: 'gin'
    });
    await queryInterface.addIndex('sessions', {
      fields: ['participants'],
      using: 'gin'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('sessions');
  }
};
