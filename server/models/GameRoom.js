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
  },
  gameFormat: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '1v1',
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'waiting',
  },
  pair_id: {
    type: DataTypes.UUID,
    allowNull: true, // Nullable для обратной совместимости
    references: {
      model: 'Pairs',
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
  }
}, {
  timestamps: true, // Включаем timestamps для createdAt и updatedAt
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});
GameRoom.associate = (models) => {
  GameRoom.belongsTo(models.User, { as: 'Host', foreignKey: 'hostId' });
  GameRoom.belongsTo(models.Pair, { 
    foreignKey: 'pair_id', 
    as: 'Pair',
    onDelete: 'SET NULL'
  });
  GameRoom.hasMany(models.GameParticipant, {
    foreignKey: 'game_room_id',
    as: 'Participants',
    onDelete: 'CASCADE'
  });
  GameRoom.belongsTo(models.Tournament, {
    foreignKey: 'tournament_id',
    as: 'Tournament',
    onDelete: 'SET NULL'
  });
};
module.exports = GameRoom;
