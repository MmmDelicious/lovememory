const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TournamentMatch = sequelize.define('TournamentMatch', {
  id: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },
  tournament_id: { 
    type: DataTypes.UUID, 
    allowNull: false,
    references: {
      model: 'tournaments',
      key: 'id'
    }
  },
  round: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },  // 1, 2, 3...
  position: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  }, // место в сетке
  participant1_id: { 
    type: DataTypes.UUID, 
    allowNull: true,
    references: {
      model: 'game_participants',
      key: 'id'
    }
  },
  participant2_id: { 
    type: DataTypes.UUID, 
    allowNull: true,
    references: {
      model: 'game_participants',
      key: 'id'
    }
  },
  winner_id: { 
    type: DataTypes.UUID, 
    allowNull: true,
    references: {
      model: 'game_participants',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'waiting', 'active', 'completed'),
    defaultValue: 'pending'
  },
  game_room_id: { 
    type: DataTypes.UUID, 
    allowNull: true,
    references: {
      model: 'game_rooms',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  }
}, { 
  tableName: 'tournament_matches',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Ассоциации
TournamentMatch.associate = (models) => {
  TournamentMatch.belongsTo(models.Tournament, {
    foreignKey: 'tournament_id',
    as: 'Tournament',
    onDelete: 'CASCADE'
  });

  TournamentMatch.belongsTo(models.GameParticipant, {
    foreignKey: 'participant1_id',
    as: 'Participant1',
    onDelete: 'SET NULL'
  });

  TournamentMatch.belongsTo(models.GameParticipant, {
    foreignKey: 'participant2_id',
    as: 'Participant2',
    onDelete: 'SET NULL'
  });

  TournamentMatch.belongsTo(models.GameParticipant, {
    foreignKey: 'winner_id',
    as: 'Winner',
    onDelete: 'SET NULL'
  });

  TournamentMatch.belongsTo(models.GameRoom, {
    foreignKey: 'game_room_id',
    as: 'GameRoom',
    onDelete: 'SET NULL'
  });
};

// Статические методы
TournamentMatch.getMatchesByTournament = async function(tournamentId, options = {}) {
  const where = { tournament_id: tournamentId };
  
  if (options.round) {
    where.round = options.round;
  }
  
  if (options.status) {
    where.status = options.status;
  }

  return await this.findAll({
    where,
    include: [
      {
        model: sequelize.models.GameParticipant,
        as: 'Participant1',
        include: [
          {
            model: sequelize.models.User,
            as: 'User',
            attributes: ['id', 'display_name', 'first_name', 'avatarUrl']
          }
        ]
      },
      {
        model: sequelize.models.GameParticipant,
        as: 'Participant2',
        include: [
          {
            model: sequelize.models.User,
            as: 'User',
            attributes: ['id', 'display_name', 'first_name', 'avatarUrl']
          }
        ]
      },
      {
        model: sequelize.models.GameParticipant,
        as: 'Winner',
        include: [
          {
            model: sequelize.models.User,
            as: 'User',
            attributes: ['id', 'display_name', 'first_name', 'avatarUrl']
          }
        ]
      }
    ],
    order: [['round', 'ASC'], ['position', 'ASC']]
  });
};

TournamentMatch.getNextMatch = async function(tournamentId, currentRound, currentPosition) {
  // Для single elimination: следующий матч в следующем раунде
  const nextRound = currentRound + 1;
  const nextPosition = Math.floor(currentPosition / 2);
  
  return await this.findOne({
    where: {
      tournament_id: tournamentId,
      round: nextRound,
      position: nextPosition
    }
  });
};

// Методы экземпляра
TournamentMatch.prototype.setReady = async function(participantId) {
  const metadata = { ...this.metadata };
  
  if (!metadata.ready_participants) {
    metadata.ready_participants = [];
  }
  
  if (!metadata.ready_participants.includes(participantId)) {
    metadata.ready_participants.push(participantId);
  }
  
  await this.update({ metadata });
  
  // Проверяем, готовы ли оба участника
  if (metadata.ready_participants.length >= 2) {
    await this.update({ status: 'waiting' });
  }
  
  return this;
};

TournamentMatch.prototype.startMatch = async function() {
  if (this.status !== 'waiting') {
    throw new Error('Match is not ready to start');
  }
  
  await this.update({ status: 'active' });
  return this;
};

TournamentMatch.prototype.completeMatch = async function(winnerId) {
  if (this.status !== 'active') {
    throw new Error('Match is not active');
  }
  
  await this.update({ 
    status: 'completed',
    winner_id: winnerId
  });
  
  return this;
};

TournamentMatch.prototype.getMatchInfo = function() {
  return {
    id: this.id,
    round: this.round,
    position: this.position,
    status: this.status,
    participant1: this.Participant1,
    participant2: this.Participant2,
    winner: this.Winner,
    gameRoomId: this.game_room_id,
    readyParticipants: this.metadata.ready_participants || []
  };
};

module.exports = TournamentMatch;
