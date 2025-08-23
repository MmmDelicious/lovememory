'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Добавляем новые поля в User для совместимости с новой схемой
    await queryInterface.addColumn('Users', 'display_name', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Отображаемое имя пользователя'
    });

    await queryInterface.addColumn('Users', 'locale', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'ru',
      comment: 'Локаль пользователя'
    });

    // Заполняем display_name из существующих first_name
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
      SET display_name = first_name 
      WHERE first_name IS NOT NULL AND display_name IS NULL
    `);
  },

  async down (queryInterface, Sequelize) {
    // Откатываем изменения - удаляем добавленные поля
    await queryInterface.removeColumn('Users', 'display_name');
    await queryInterface.removeColumn('Users', 'locale');
  }
};
