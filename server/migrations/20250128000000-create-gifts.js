'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gifts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      fromUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      toUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      giftType: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isIn: [['guitar', 'running-character']]
        }
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      photoPath: {
        type: Sequelize.STRING,
        allowNull: true
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        }
      },
      isDelivered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isViewed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      viewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('gifts', ['fromUserId'], {
      name: 'gifts_from_user_id_index'
    });

    await queryInterface.addIndex('gifts', ['toUserId'], {
      name: 'gifts_to_user_id_index'
    });

    await queryInterface.addIndex('gifts', ['isDelivered'], {
      name: 'gifts_is_delivered_index'
    });

    await queryInterface.addIndex('gifts', ['isViewed'], {
      name: 'gifts_is_viewed_index'
    });

    await queryInterface.addIndex('gifts', ['createdAt'], {
      name: 'gifts_created_at_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('gifts');
  }
};
