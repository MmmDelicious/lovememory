'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Добавляем поля для покерных столов
    await queryInterface.addColumn('GameRooms', 'tableType', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('GameRooms', 'blinds', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down (queryInterface, Sequelize) {
    // Удаляем добавленные поля при откате
    await queryInterface.removeColumn('GameRooms', 'tableType');
    await queryInterface.removeColumn('GameRooms', 'blinds');
  }
};
