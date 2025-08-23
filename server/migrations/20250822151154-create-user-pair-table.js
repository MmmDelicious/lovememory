'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Создаем таблицу user_pair для many-to-many связи между users и pairs
    await queryInterface.createTable('user_pairs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      pair_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Pairs',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'member',
        comment: 'Роль пользователя в паре: member, admin'
      },
      accepted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Принял ли пользователь приглашение в пару'
      },
      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Добавляем уникальный индекс на user_id + pair_id
    await queryInterface.addIndex('user_pairs', ['user_id', 'pair_id'], {
      unique: true,
      name: 'unique_user_pair'
    });

    // Добавляем индексы для быстрого поиска
    await queryInterface.addIndex('user_pairs', ['user_id']);
    await queryInterface.addIndex('user_pairs', ['pair_id']);
    await queryInterface.addIndex('user_pairs', ['accepted']);
  },

  async down (queryInterface, Sequelize) {
    // Удаляем индексы перед удалением таблицы
    await queryInterface.removeIndex('user_pairs', 'unique_user_pair');
    await queryInterface.removeIndex('user_pairs', ['user_id']);
    await queryInterface.removeIndex('user_pairs', ['pair_id']);
    await queryInterface.removeIndex('user_pairs', ['accepted']);
    
    // Удаляем таблицу
    await queryInterface.dropTable('user_pairs');
  }
};
