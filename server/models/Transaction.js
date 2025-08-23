const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pair_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Pairs',
      key: 'id',
    },
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  tournament_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'tournaments',
      key: 'id',
    },
  },
  tx_type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['credit', 'debit', 'purchase', 'refund', 'bonus', 'penalty', 'tournament_entry', 'tournament_prize']],
    },
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'COIN',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'transactions',
  indexes: [
    {
      fields: ['pair_id'],
      name: 'idx_transactions_pair'
    },
    {
      fields: ['user_id'],
      name: 'idx_transactions_user'
    },
    {
      fields: ['tx_type'],
      name: 'idx_transactions_type'
    },
    {
      fields: ['created_at'],
      name: 'idx_transactions_created'
    },
    {
      fields: ['pair_id', 'created_at'],
      name: 'idx_transactions_pair_created'
    }
  ]
});

Transaction.associate = (models) => {
  Transaction.belongsTo(models.Pair, {
    foreignKey: 'pair_id',
    as: 'Pair',
    onDelete: 'CASCADE'
  });
  Transaction.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User',
    onDelete: 'SET NULL'
  });
  Transaction.belongsTo(models.Tournament, {
    foreignKey: 'tournament_id',
    as: 'Tournament',
    onDelete: 'SET NULL'
  });
};

// Статические методы для создания разных типов транзакций
Transaction.createCredit = async function(pairId, userId, amount, metadata = {}) {
  return await this.create({
    pair_id: pairId,
    user_id: userId,
    tx_type: 'credit',
    amount: Math.abs(amount),
    metadata
  });
};

Transaction.createDebit = async function(pairId, userId, amount, metadata = {}) {
  return await this.create({
    pair_id: pairId,
    user_id: userId,
    tx_type: 'debit',
    amount: -Math.abs(amount),
    metadata
  });
};

Transaction.createPurchase = async function(pairId, userId, amount, itemId, metadata = {}) {
  return await this.create({
    pair_id: pairId,
    user_id: userId,
    tx_type: 'purchase',
    amount: -Math.abs(amount),
    metadata: { item_id: itemId, ...metadata }
  });
};

module.exports = Transaction;
