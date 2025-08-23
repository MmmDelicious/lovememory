'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Добавляем creator_id в tournaments
    await queryInterface.addColumn('tournaments', 'creator_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });

    // Добавляем tournament_id в game_participants
    await queryInterface.addColumn('game_participants', 'tournament_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'tournaments',
        key: 'id'
      },
      onDelete: 'CASCADE'
    });

    // Добавляем tournament_id в game_rooms (переименовываем из GameRooms)
    await queryInterface.addColumn('GameRooms', 'tournament_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'tournaments',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });

    // Добавляем tournament_id в transactions
    await queryInterface.addColumn('transactions', 'tournament_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'tournaments',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });

    // Добавляем индексы
    await queryInterface.addIndex('tournaments', ['creator_id']);
    await queryInterface.addIndex('game_participants', ['tournament_id']);
    await queryInterface.addIndex('GameRooms', ['tournament_id']);
    await queryInterface.addIndex('transactions', ['tournament_id']);
  },

  async down (queryInterface, Sequelize) {
    // Удаляем добавленные колонки в обратном порядке
    await queryInterface.removeColumn('transactions', 'tournament_id');
    await queryInterface.removeColumn('GameRooms', 'tournament_id');
    await queryInterface.removeColumn('game_participants', 'tournament_id');
    await queryInterface.removeColumn('tournaments', 'creator_id');
  }
};
