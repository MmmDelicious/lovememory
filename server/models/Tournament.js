const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tournament = sequelize.define('Tournament', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('single_elimination', 'double_elimination', 'round_robin', 'swiss'),
      allowNull: false,
      defaultValue: 'single_elimination'
    },
    status: {
      type: DataTypes.ENUM('preparing', 'registering', 'active', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'preparing'
    },
    max_participants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 16
    },
    entry_fee_coins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    prize_pool: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    creator_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
}, {
  tableName: 'tournaments',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Ассоциации
Tournament.associate = (models) => {
  // Турниры могут иметь участников (пары или пользователи)
  Tournament.hasMany(models.GameParticipant, {
    foreignKey: 'tournament_id',
    as: 'Participants',
    onDelete: 'CASCADE'
  });

  // Турниры создаются пользователями
  Tournament.belongsTo(models.User, {
    foreignKey: 'creator_id',
    as: 'Creator',
    onDelete: 'SET NULL'
  });

  // Турниры могут иметь связанные game rooms
  Tournament.hasMany(models.GameRoom, {
    foreignKey: 'tournament_id',
    as: 'GameRooms',
    onDelete: 'SET NULL'
  });

  // Связь с транзакциями (призовые)
  Tournament.hasMany(models.Transaction, {
    foreignKey: 'tournament_id',
    as: 'Transactions',
    onDelete: 'SET NULL'
  });
};

// Статические методы для работы с турнирами
Tournament.createTournament = async function(data) {
  try {
    const tournament = await this.create({
      name: data.name,
      description: data.description,
      type: data.type || 'single_elimination',
      max_participants: data.max_participants || 16,
      entry_fee_coins: data.entry_fee_coins || 0,
      prize_pool: data.prize_pool || 0,
      start_date: data.start_date,
      end_date: data.end_date,
      creator_id: data.creator_id,
      metadata: data.metadata || {}
    });

    return tournament;
  } catch (error) {
    console.error('Error creating tournament:', error);
    throw error;
  }
};

Tournament.getActiveTournaments = async function() {
  return await this.findAll({
    where: {
      status: ['registering', 'active']
    },
    include: [
      {
        model: sequelize.models.User,
        as: 'Creator',
        attributes: ['id', 'display_name', 'first_name']
      }
    ],
    order: [['start_date', 'ASC']]
  });
};

Tournament.getTournamentWithParticipants = async function(tournamentId) {
  return await this.findByPk(tournamentId, {
    include: [
      {
        model: sequelize.models.GameParticipant,
        as: 'Participants',
        include: [
          {
            model: sequelize.models.User,
            as: 'User',
            attributes: ['id', 'display_name', 'first_name']
          }
        ]
      },
      {
        model: sequelize.models.User,
        as: 'Creator',
        attributes: ['id', 'display_name', 'first_name']
      }
    ]
  });
};

// Методы экземпляра
Tournament.prototype.register = async function(userId) {
  // Проверяем, может ли пользователь зарегистрироваться
  if (this.status !== 'registering') {
    throw new Error('Tournament is not accepting registrations');
  }

  const currentParticipants = await sequelize.models.GameParticipant.count({
    where: { tournament_id: this.id }
  });

  if (currentParticipants >= this.max_participants) {
    throw new Error('Tournament is full');
  }

  // Проверяем, не зарегистрирован ли уже
  const existingParticipant = await sequelize.models.GameParticipant.findOne({
    where: {
      tournament_id: this.id,
      user_id: userId
    }
  });

  if (existingParticipant) {
    throw new Error('User already registered for this tournament');
  }

  // Регистрируем участника
  await sequelize.models.GameParticipant.create({
    game_room_id: null, // Явно указываем null для турнирных участников
    tournament_id: this.id,
    user_id: userId,
    is_host: false,
    stats: {}
  });

  // Списываем entry fee если есть
  if (this.entry_fee_coins > 0) {
          await sequelize.models.Transaction.create({
        pair_id: null, // Турнирные транзакции не привязаны к парам
        user_id: userId,
        tournament_id: this.id,
        tx_type: 'tournament_entry',
        amount: -this.entry_fee_coins,
        currency: 'coins',
        metadata: {
          tournament_name: this.name
        }
      });
  }

  return true;
};

Tournament.prototype.start = async function() {
  if (this.status !== 'registering') {
    throw new Error('Tournament cannot be started');
  }

  await this.update({
    status: 'active',
    start_date: new Date()
  });

  return true;
};

Tournament.prototype.complete = async function(winnerId = null) {
  if (this.status !== 'active') {
    throw new Error('Tournament is not active');
  }

  await this.update({
    status: 'completed',
    end_date: new Date(),
    metadata: {
      ...this.metadata,
      winner_id: winnerId
    }
  });

  // Выплачиваем призовые если есть
  if (winnerId && this.prize_pool > 0) {
          await sequelize.models.Transaction.create({
        pair_id: null, // Турнирные транзакции не привязаны к парам
        user_id: winnerId,
        tournament_id: this.id,
        tx_type: 'tournament_prize',
        amount: this.prize_pool,
        currency: 'coins',
        metadata: {
          tournament_name: this.name,
          place: 1
        }
      });
  }

  return true;
};

module.exports = Tournament;
