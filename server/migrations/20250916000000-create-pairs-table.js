'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pairs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user1_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      user2_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'inactive'),
        defaultValue: 'pending',
        allowNull: false,
      },
      connection_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_activity: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      shared_memories_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      relationship_level: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
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

    // Добавляем индексы для оптимизации
    await queryInterface.addIndex('pairs', ['user1_id']);
    await queryInterface.addIndex('pairs', ['user2_id']);
    await queryInterface.addIndex('pairs', ['status']);
    await queryInterface.addIndex('pairs', ['user1_id', 'user2_id'], {
      unique: true,
      name: 'unique_pair_users'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pairs');
  }
};
