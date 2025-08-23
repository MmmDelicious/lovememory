'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Создаем таблицу GAME_PARTICIPANT согласно целевой схеме
    await queryInterface.createTable('game_participants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      game_room_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'GameRooms',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'ID игровой комнаты'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'ID участника игры'
      },
      is_host: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Является ли участник хостом игры'
      },
      stats: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Статистика игрока в JSON формате'
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: 'Время присоединения к игре'
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

    // Добавляем индексы для быстрого поиска
    await queryInterface.addIndex('game_participants', ['game_room_id'], {
      name: 'idx_game_participants_room'
    });

    await queryInterface.addIndex('game_participants', ['user_id'], {
      name: 'idx_game_participants_user'
    });

    await queryInterface.addIndex('game_participants', ['game_room_id', 'user_id'], {
      unique: true,
      name: 'unique_game_room_user'
    });

    await queryInterface.addIndex('game_participants', ['is_host'], {
      name: 'idx_game_participants_host'
    });
  },

  async down (queryInterface, Sequelize) {
    // Удаляем индексы перед удалением таблицы
    await queryInterface.removeIndex('game_participants', 'idx_game_participants_room');
    await queryInterface.removeIndex('game_participants', 'idx_game_participants_user');
    await queryInterface.removeIndex('game_participants', 'unique_game_room_user');
    await queryInterface.removeIndex('game_participants', 'idx_game_participants_host');
    
    // Удаляем таблицу
    await queryInterface.dropTable('game_participants');
  }
};
