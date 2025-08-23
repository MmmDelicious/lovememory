'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // ===== SHOP_ITEM TABLE =====
    // Создаем таблицу SHOP_ITEM согласно целевой схеме
    await queryInterface.createTable('shop_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      sku: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
        comment: 'Уникальный артикул товара (Stock Keeping Unit)'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Название товара'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Описание товара'
      },
      price_coins: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Цена товара в монетах'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Метаданные товара в JSON формате'
      },
      is_virtual: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Является ли товар виртуальным'
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

    // ===== TRANSACTION TABLE =====
    // Создаем таблицу TRANSACTION согласно целевой схеме
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      pair_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Pairs',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'ID пары для которой совершается транзакция'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'ID пользователя (может быть null для системных транзакций)'
      },
      tx_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Тип транзакции: credit, debit, purchase, refund'
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Сумма транзакции (может быть отрицательной)'
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'COIN',
        comment: 'Валюта транзакции'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
        comment: 'Метаданные транзакции в JSON формате'
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

    // ===== ОБНОВЛЯЕМ GIFT TABLE =====
    // Добавляем recipient_pair_id для соответствия целевой схеме
    await queryInterface.addColumn('gifts', 'recipient_pair_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Pairs',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'ID пары-получателя подарка'
    });

    await queryInterface.addColumn('gifts', 'shop_item_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'shop_items',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'ID товара из магазина'
    });

    // ===== ИНДЕКСЫ =====
    // SHOP_ITEM индексы
    await queryInterface.addIndex('shop_items', ['sku'], {
      unique: true,
      name: 'unique_shop_item_sku'
    });

    await queryInterface.addIndex('shop_items', ['is_virtual'], {
      name: 'idx_shop_items_virtual'
    });

    await queryInterface.addIndex('shop_items', ['price_coins'], {
      name: 'idx_shop_items_price'
    });

    // TRANSACTION индексы
    await queryInterface.addIndex('transactions', ['pair_id'], {
      name: 'idx_transactions_pair'
    });

    await queryInterface.addIndex('transactions', ['user_id'], {
      name: 'idx_transactions_user'
    });

    await queryInterface.addIndex('transactions', ['tx_type'], {
      name: 'idx_transactions_type'
    });

    await queryInterface.addIndex('transactions', ['created_at'], {
      name: 'idx_transactions_created'
    });

    await queryInterface.addIndex('transactions', ['pair_id', 'created_at'], {
      name: 'idx_transactions_pair_created'
    });

    // GIFT индексы для новых полей
    await queryInterface.addIndex('gifts', ['recipient_pair_id'], {
      name: 'idx_gifts_recipient_pair'
    });

    await queryInterface.addIndex('gifts', ['shop_item_id'], {
      name: 'idx_gifts_shop_item'
    });
  },

  async down (queryInterface, Sequelize) {
    // Откат в обратном порядке
    
    // Удаляем индексы GIFT
    await queryInterface.removeIndex('gifts', 'idx_gifts_recipient_pair');
    await queryInterface.removeIndex('gifts', 'idx_gifts_shop_item');
    
    // Удаляем индексы TRANSACTION
    await queryInterface.removeIndex('transactions', 'idx_transactions_pair');
    await queryInterface.removeIndex('transactions', 'idx_transactions_user');
    await queryInterface.removeIndex('transactions', 'idx_transactions_type');
    await queryInterface.removeIndex('transactions', 'idx_transactions_created');
    await queryInterface.removeIndex('transactions', 'idx_transactions_pair_created');
    
    // Удаляем индексы SHOP_ITEM
    await queryInterface.removeIndex('shop_items', 'unique_shop_item_sku');
    await queryInterface.removeIndex('shop_items', 'idx_shop_items_virtual');
    await queryInterface.removeIndex('shop_items', 'idx_shop_items_price');
    
    // Удаляем новые поля из GIFT
    await queryInterface.removeColumn('gifts', 'recipient_pair_id');
    await queryInterface.removeColumn('gifts', 'shop_item_id');
    
    // Удаляем таблицы
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('shop_items');
  }
};
