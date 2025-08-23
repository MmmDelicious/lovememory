const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserPair = sequelize.define('UserPair', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  pair_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Pairs',
      key: 'id',
    },
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'member',
    validate: {
      isIn: [['member', 'admin']],
    },
  },
  accepted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  joined_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'user_pairs',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'pair_id'],
      name: 'unique_user_pair'
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['pair_id']
    },
    {
      fields: ['accepted']
    }
  ]
});

UserPair.associate = (models) => {
  UserPair.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User'
  });
  UserPair.belongsTo(models.Pair, {
    foreignKey: 'pair_id',
    as: 'Pair'
  });
};

module.exports = UserPair;
