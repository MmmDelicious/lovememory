'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('GameRooms', 'players', {
      type: Sequelize.ARRAY(Sequelize.UUID),
      allowNull: false,
      defaultValue: [],
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('GameRooms', 'players');
  }
};