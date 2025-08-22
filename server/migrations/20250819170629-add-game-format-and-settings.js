'use strict';
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('GameRooms', 'gameFormat', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: '1v1'
    });
    await queryInterface.addColumn('GameRooms', 'gameSettings', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null
    });
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('GameRooms', 'gameFormat');
    await queryInterface.removeColumn('GameRooms', 'gameSettings');
  }
};

