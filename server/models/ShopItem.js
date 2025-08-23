const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShopItem = sequelize.define('ShopItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sku: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price_coins: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  is_virtual: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'shop_items',
  indexes: [
    {
      unique: true,
      fields: ['sku'],
      name: 'unique_shop_item_sku'
    },
    {
      fields: ['is_virtual'],
      name: 'idx_shop_items_virtual'
    },
    {
      fields: ['price_coins'],
      name: 'idx_shop_items_price'
    }
  ]
});

ShopItem.associate = (models) => {
  ShopItem.hasMany(models.Gift, {
    foreignKey: 'shop_item_id',
    as: 'Gifts',
    onDelete: 'SET NULL'
  });
};

module.exports = ShopItem;
