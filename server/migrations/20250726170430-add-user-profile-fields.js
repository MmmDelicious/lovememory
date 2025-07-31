'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Сначала добавляем поля как nullable
    await queryInterface.addColumn('Users', 'gender', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'age', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Заполняем существующие записи значениями по умолчанию
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
      SET 
        gender = 'other',
        age = 25,
        city = 'Не указан'
      WHERE gender IS NULL OR age IS NULL OR city IS NULL
    `);

    // Теперь делаем поля NOT NULL
    await queryInterface.changeColumn('Users', 'gender', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('Users', 'age', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.changeColumn('Users', 'city', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    // Удаляем добавленные поля при откате
    await queryInterface.removeColumn('Users', 'gender');
    await queryInterface.removeColumn('Users', 'age');
    await queryInterface.removeColumn('Users', 'city');
  }
}; 