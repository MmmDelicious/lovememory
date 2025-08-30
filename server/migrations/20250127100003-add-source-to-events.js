'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Events', 'source', {
      type: Sequelize.ENUM('USER_CREATED', 'AI_SUGGESTED'),
      allowNull: false,
      defaultValue: 'USER_CREATED',
      comment: 'Источник создания события: пользователем или AI',
    });

    // Создаем индекс для быстрого поиска по источнику
    await queryInterface.addIndex('Events', ['source'], {
      name: 'idx_events_source'
    });

    // Создаем составной индекс для аналитики
    await queryInterface.addIndex('Events', ['pair_id', 'source', 'event_date'], {
      name: 'idx_events_pair_source_date'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Events', 'source');
  }
};
