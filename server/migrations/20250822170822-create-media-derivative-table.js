'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('media_derivatives', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      source_media_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Media',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      derivative_type: {
        type: Sequelize.ENUM('thumbnail', 'preview', 'optimized', 'webp', 'blur_hash', 'low_quality'),
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      size_bytes: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      width: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      height: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      format: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quality: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 100
        }
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      created_at: {
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

    // Добавляем индексы
    await queryInterface.addIndex('media_derivatives', ['source_media_id']);
    await queryInterface.addIndex('media_derivatives', ['derivative_type']);
    await queryInterface.addIndex('media_derivatives', ['source_media_id', 'derivative_type'], {
      unique: true,
      name: 'unique_media_derivative_type'
    });
    await queryInterface.addIndex('media_derivatives', ['file_path']);
    await queryInterface.addIndex('media_derivatives', {
      fields: ['metadata'],
      using: 'gin'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('media_derivatives');
  }
};
