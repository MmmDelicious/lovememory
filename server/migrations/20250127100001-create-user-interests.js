'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_interests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      interest_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'interests',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      preference: {
        type: Sequelize.ENUM('love', 'like', 'neutral', 'dislike'),
        allowNull: false,
        defaultValue: 'like',
      },
      intensity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
          min: 1,
          max: 10,
        },
      },
      added_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      last_activity: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      }
    });

    // Создаем индексы
    await queryInterface.addIndex('user_interests', ['user_id'], {
      name: 'idx_user_interests_user'
    });

    await queryInterface.addIndex('user_interests', ['interest_id'], {
      name: 'idx_user_interests_interest'
    });

    await queryInterface.addIndex('user_interests', ['user_id', 'interest_id'], {
      name: 'idx_user_interests_unique',
      unique: true
    });

    await queryInterface.addIndex('user_interests', ['preference'], {
      name: 'idx_user_interests_preference'
    });

    await queryInterface.addIndex('user_interests', ['intensity'], {
      name: 'idx_user_interests_intensity'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_interests');
  }
};
