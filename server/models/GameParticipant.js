const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GameParticipant = sequelize.define('GameParticipant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  game_room_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'GameRooms',
      key: 'id',
    },
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
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
  is_host: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  stats: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  joined_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'game_participants',
  indexes: [
    {
      fields: ['game_room_id'],
      name: 'idx_game_participants_room'
    },
    {
      fields: ['user_id'],
      name: 'idx_game_participants_user'
    },
    {
      unique: true,
      fields: ['game_room_id', 'user_id'],
      name: 'unique_game_room_user'
    },
    {
      fields: ['is_host'],
      name: 'idx_game_participants_host'
    }
  ]
});

GameParticipant.associate = (models) => {
  GameParticipant.belongsTo(models.GameRoom, {
    foreignKey: 'game_room_id',
    as: 'GameRoom',
    onDelete: 'CASCADE'
  });
  GameParticipant.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User',
    onDelete: 'CASCADE'
  });
  GameParticipant.belongsTo(models.Tournament, {
    foreignKey: 'tournament_id',
    as: 'Tournament',
    onDelete: 'CASCADE'
  });
};

module.exports = GameParticipant;
