'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Добавляем pair_id в Media (nullable для совместимости)
    await queryInterface.addColumn('Media', 'pair_id', {
      type: Sequelize.UUID,
      allowNull: true, // ВАЖНО! Nullable для существующих записей
      references: {
        model: 'Pairs',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'ID пары, к которой принадлежит медиа'
    });

    // Добавляем pair_id в GameRooms (nullable для совместимости)
    await queryInterface.addColumn('GameRooms', 'pair_id', {
      type: Sequelize.UUID,
      allowNull: true, // ВАЖНО! Nullable для существующих записей
      references: {
        model: 'Pairs',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'ID пары, к которой принадлежит игровая комната'
    });

    // Добавляем индексы для быстрого поиска
    await queryInterface.addIndex('Media', ['pair_id'], {
      name: 'idx_media_pair_id'
    });

    await queryInterface.addIndex('GameRooms', ['pair_id'], {
      name: 'idx_gamerooms_pair_id'
    });

    // Составные индексы для оптимизации запросов
    await queryInterface.addIndex('Media', ['pair_id', 'createdAt'], {
      name: 'idx_media_pair_created'
    });

    await queryInterface.addIndex('GameRooms', ['pair_id', 'status'], {
      name: 'idx_gamerooms_pair_status'
    });
  },

  async down (queryInterface, Sequelize) {
    // Удаляем индексы перед удалением колонок
    await queryInterface.removeIndex('Media', 'idx_media_pair_id');
    await queryInterface.removeIndex('Media', 'idx_media_pair_created');
    await queryInterface.removeIndex('GameRooms', 'idx_gamerooms_pair_id');
    await queryInterface.removeIndex('GameRooms', 'idx_gamerooms_pair_status');
    
    // Удаляем колонки pair_id
    await queryInterface.removeColumn('Media', 'pair_id');
    await queryInterface.removeColumn('GameRooms', 'pair_id');
  }
};
