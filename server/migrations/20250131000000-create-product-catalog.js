'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_catalog', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Название товара/места'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Описание товара/места'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Категория: restaurant, cafe, entertainment, gift, activity'
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
        comment: 'Теги для поиска и фильтрации'
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Цена в рублях'
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'RUB',
        comment: 'Валюта'
      },
      external_ids: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Внешние ID (Yandex, Google, etc.)'
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
        comment: 'Широта'
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
        comment: 'Долгота'
      },
      embedding: {
        type: Sequelize.ARRAY(Sequelize.FLOAT),
        allowNull: true,
        comment: 'Векторное представление для semantic search'
      },
      love_language: {
        type: Sequelize.ENUM('quality_time', 'physical_touch', 'words_of_affirmation', 'acts_of_service', 'receiving_gifts'),
        allowNull: true,
        comment: 'Какой язык любви подходит для этого товара'
      },
      budget_level: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium',
        comment: 'Уровень бюджета'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Активен ли товар'
      },
      popularity_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Популярность товара (0-100)'
      },
      last_synced: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Последняя синхронизация с внешними источниками'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    }, {
      indexes: [
        {
          fields: ['category'],
          name: 'idx_product_catalog_category'
        },
        {
          fields: ['tags'],
          name: 'idx_product_catalog_tags',
          using: 'gin'
        },
        {
          fields: ['price'],
          name: 'idx_product_catalog_price'
        },
        {
          fields: ['budget_level'],
          name: 'idx_product_catalog_budget'
        },
        {
          fields: ['love_language'],
          name: 'idx_product_catalog_love_language'
        },
        {
          fields: ['is_active'],
          name: 'idx_product_catalog_active'
        },
        {
          fields: ['popularity_score'],
          name: 'idx_product_catalog_popularity'
        },
        {
          fields: ['latitude', 'longitude'],
          name: 'idx_product_catalog_location'
        }
      ]
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_catalog');
  }
};
