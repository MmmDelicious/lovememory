'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Переименовываем поле timestamp в ActivityLog таблице
    await queryInterface.renameColumn('activity_logs', 'created_at', 'createdAt');
  },

  down: async (queryInterface, Sequelize) => {
    // Откатываем изменения
    await queryInterface.renameColumn('activity_logs', 'createdAt', 'created_at');
  }
};
