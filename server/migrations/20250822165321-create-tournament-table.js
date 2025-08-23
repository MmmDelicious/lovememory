'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tournaments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('single_elimination', 'double_elimination', 'round_robin', 'swiss'),
        allowNull: false,
        defaultValue: 'single_elimination'
      },
      status: {
        type: Sequelize.ENUM('preparing', 'registering', 'active', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'preparing'
      },
      max_participants: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 16
      },
      entry_fee_coins: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      prize_pool: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
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
    await queryInterface.addIndex('tournaments', ['status']);
    await queryInterface.addIndex('tournaments', ['type']);
    await queryInterface.addIndex('tournaments', ['start_date']);
    await queryInterface.addIndex('tournaments', ['end_date']);
    await queryInterface.addIndex('tournaments', {
      fields: ['metadata'],
      using: 'gin'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('tournaments');
  }
};
