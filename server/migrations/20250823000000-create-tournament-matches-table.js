'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tournament_matches', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      tournament_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tournaments',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      round: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      participant1_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'game_participants',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      participant2_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'game_participants',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      winner_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'game_participants',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('pending', 'waiting', 'active', 'completed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      game_room_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'game_rooms',
          key: 'id'
        },
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('tournament_matches', ['tournament_id']);
    await queryInterface.addIndex('tournament_matches', ['round']);
    await queryInterface.addIndex('tournament_matches', ['position']);
    await queryInterface.addIndex('tournament_matches', ['status']);
    await queryInterface.addIndex('tournament_matches', ['participant1_id']);
    await queryInterface.addIndex('tournament_matches', ['participant2_id']);
    await queryInterface.addIndex('tournament_matches', ['winner_id']);
    await queryInterface.addIndex('tournament_matches', ['game_room_id']);
    await queryInterface.addIndex('tournament_matches', {
      fields: ['tournament_id', 'round', 'position'],
      unique: true,
      name: 'unique_tournament_round_position'
    });
    await queryInterface.addIndex('tournament_matches', {
      fields: ['metadata'],
      using: 'gin'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('tournament_matches');
  }
};
