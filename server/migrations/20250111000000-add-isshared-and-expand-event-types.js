'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем поле isShared
    await queryInterface.addColumn('Events', 'isShared', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    // Добавляем поля для повторяющихся событий
    await queryInterface.addColumn('Events', 'is_recurring', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('Events', 'recurrence_rule', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    await queryInterface.addColumn('Events', 'parent_event_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Events',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });



    // Расширяем типы событий
    await queryInterface.changeColumn('Events', 'event_type', {
      type: Sequelize.ENUM(
        'memory',      // воспоминания
        'plan',        // планы
        'anniversary', // годовщины
        'birthday',    // дни рождения
        'travel',      // путешествия
        'date',        // свидания
        'gift',        // подарки
        'milestone'    // важные моменты
      ),
      defaultValue: 'plan',
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Удаляем поля для повторяющихся событий
    await queryInterface.removeColumn('Events', 'parent_event_id');
    await queryInterface.removeColumn('Events', 'recurrence_rule');
    await queryInterface.removeColumn('Events', 'is_recurring');
    
    // Удаляем поле isShared  
    await queryInterface.removeColumn('Events', 'isShared');

    // Возвращаем старые типы событий
    await queryInterface.changeColumn('Events', 'event_type', {
      type: Sequelize.ENUM('memory', 'plan', 'anniversary'),
      defaultValue: 'plan',
      allowNull: false
    });
  }
}; 