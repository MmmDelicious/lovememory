'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Изменяем game_room_id чтобы он мог быть null (для участников турниров без конкретной комнаты)
    await queryInterface.changeColumn('game_participants', 'game_room_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'GameRooms',
        key: 'id',
      },
    });
  },

  async down (queryInterface, Sequelize) {
    // Возвращаем обратно - делаем game_room_id обязательным
    await queryInterface.changeColumn('game_participants', 'game_room_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'GameRooms',
        key: 'id',
      },
    });
  }
};
