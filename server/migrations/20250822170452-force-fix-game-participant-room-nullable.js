'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Принудительно удаляем NOT NULL ограничение с game_room_id в game_participants
    try {
      // Сначала проверяем, существует ли таблица
      const tableExists = await queryInterface.tableExists('game_participants');
      if (tableExists) {
        // Прямой SQL запрос для изменения столбца
        await queryInterface.sequelize.query(`
          ALTER TABLE game_participants 
          ALTER COLUMN game_room_id DROP NOT NULL;
        `);
        console.log('✅ Successfully made game_room_id nullable in game_participants');
      }
    } catch (error) {
      console.log('⚠️ Could not modify game_room_id constraint:', error.message);
      // Попробуем через changeColumn
      try {
        await queryInterface.changeColumn('game_participants', 'game_room_id', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'GameRooms',
            key: 'id',
          },
        });
        console.log('✅ Successfully changed game_room_id via changeColumn');
      } catch (changeError) {
        console.log('❌ Failed to change column:', changeError.message);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // Возвращаем NOT NULL ограничение
    await queryInterface.sequelize.query(`
      ALTER TABLE game_participants 
      ALTER COLUMN game_room_id SET NOT NULL;
    `);
  }
};
