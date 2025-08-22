const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Pair = sequelize.define('Pair', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user1Id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  user2Id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'active'),
    defaultValue: 'pending',
    allowNull: false,
  },
});
Pair.associate = (models) => {
  Pair.belongsTo(models.User, {
    as: 'Requester',
    foreignKey: 'user1Id',
  });
  Pair.belongsTo(models.User, {
    as: 'Receiver',
    foreignKey: 'user2Id',
  });
};
module.exports = Pair;
