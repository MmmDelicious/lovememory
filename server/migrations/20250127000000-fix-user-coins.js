'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Обновляем всех пользователей у которых coins равен NULL или 0, устанавливаем случайное значение от 1000 до 1500
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
      SET coins = FLOOR(RANDOM() * 500) + 1000 
      WHERE coins IS NULL OR coins = 0;
    `);
    
    },

  down: async (queryInterface, Sequelize) => {
    // В down ничего не делаем, так как откатывать монеты не нужно
    }
};
