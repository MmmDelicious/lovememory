const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GameRoom = sequelize.define('GameRoom', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  gameType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('waiting', 'in_progress', 'finished'),
    allowNull: false,
    defaultValue: 'waiting',
  },
  bet: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  tableType: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  blinds: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  maxPlayers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
  },
  hostId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  players: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: false,
    defaultValue: [],
  }
});

GameRoom.associate = (models) => {
  GameRoom.belongsTo(models.User, { as: 'Host', foreignKey: 'hostId' });
};

module.exports = GameRoom;