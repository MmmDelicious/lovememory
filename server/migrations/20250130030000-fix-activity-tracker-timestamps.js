'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Переименовываем поля timestamp в ActivityTracker таблице
    await queryInterface.renameColumn('activity_trackers', 'created_at', 'createdAt');
    await queryInterface.renameColumn('activity_trackers', 'updated_at', 'updatedAt');
  },

  down: async (queryInterface, Sequelize) => {
    // Откатываем изменения
    await queryInterface.renameColumn('activity_trackers', 'createdAt', 'created_at');
    await queryInterface.renameColumn('activity_trackers', 'updatedAt', 'updated_at');
  }
};
