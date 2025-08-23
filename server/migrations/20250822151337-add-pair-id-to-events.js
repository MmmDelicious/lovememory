'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Добавляем pair_id в Events (nullable для совместимости)
    await queryInterface.addColumn('Events', 'pair_id', {
      type: Sequelize.UUID,
      allowNull: true, // ВАЖНО! Nullable для существующих записей
      references: {
        model: 'Pairs',
        key: 'id'
      },
      onDelete: 'SET NULL', // Если пара удалена, событие остается
      comment: 'ID пары, к которой принадлежит событие'
    });

    // Добавляем индекс для быстрого поиска событий по паре
    await queryInterface.addIndex('Events', ['pair_id'], {
      name: 'idx_events_pair_id'
    });

    // Добавляем составной индекс для поиска событий пары по дате
    await queryInterface.addIndex('Events', ['pair_id', 'event_date'], {
      name: 'idx_events_pair_date'
    });
  },

  async down (queryInterface, Sequelize) {
    // Удаляем индексы перед удалением колонки
    await queryInterface.removeIndex('Events', 'idx_events_pair_id');
    await queryInterface.removeIndex('Events', 'idx_events_pair_date');
    
    // Удаляем колонку pair_id
    await queryInterface.removeColumn('Events', 'pair_id');
  }
};
