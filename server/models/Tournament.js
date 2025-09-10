const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// TournamentMatch будет доступен через sequelize.models

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
        model: 'users',
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


  // Связь с матчами турнира
  Tournament.hasMany(models.TournamentMatch, {
    foreignKey: 'tournament_id',
    as: 'Matches',
    onDelete: 'CASCADE'
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

  // Проверяем минимальное количество участников
  const participantsCount = await sequelize.models.GameParticipant.count({
    where: { tournament_id: this.id }
  });

  if (participantsCount < 2) {
    throw new Error('Tournament needs at least 2 participants to start');
  }

  // Формируем сетку турнира
  await this.generateBracket();

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

// Метод формирования сетки турнира
Tournament.prototype.generateBracket = async function() {
  const participants = await sequelize.models.GameParticipant.findAll({
    where: { tournament_id: this.id },
    order: [['joined_at', 'ASC']]
  });

  if (participants.length < 2) {
    throw new Error('Not enough participants to generate bracket');
  }

  // Очищаем существующие матчи
  await sequelize.models.TournamentMatch.destroy({
    where: { tournament_id: this.id }
  });

  let matches = [];

  switch (this.type) {
    case 'single_elimination':
      matches = this.generateSingleEliminationBracket(participants);
      break;
    case 'double_elimination':
      matches = this.generateDoubleEliminationBracket(participants);
      break;
    case 'round_robin':
      matches = this.generateRoundRobinBracket(participants);
      break;
    case 'swiss':
      matches = this.generateSwissBracket(participants);
      break;
    default:
      throw new Error(`Unsupported tournament type: ${this.type}`);
  }

  // Создаем матчи в базе данных
  for (const match of matches) {
    await sequelize.models.TournamentMatch.create({
      tournament_id: this.id,
      round: match.round,
      position: match.position,
      participant1_id: match.participant1_id,
      participant2_id: match.participant2_id,
      status: 'pending'
    });
  }

  return matches;
};

// Генерация сетки single elimination
Tournament.prototype.generateSingleEliminationBracket = function(participants) {
  const matches = [];
  const participantsCount = participants.length;
  
  // Вычисляем количество раундов
  const rounds = Math.ceil(Math.log2(participantsCount));
  const totalSlots = Math.pow(2, rounds);
  
  // Создаем первый раунд
  for (let i = 0; i < totalSlots / 2; i++) {
    const participant1 = participants[i * 2] || null;
    const participant2 = participants[i * 2 + 1] || null;
    
    if (participant1 || participant2) {
      matches.push({
        round: 1,
        position: i,
        participant1_id: participant1 ? participant1.id : null,
        participant2_id: participant2 ? participant2.id : null
      });
    }
  }
  
  // Создаем последующие раунды (без участников пока)
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    for (let pos = 0; pos < matchesInRound; pos++) {
      matches.push({
        round,
        position: pos,
        participant1_id: null,
        participant2_id: null
      });
    }
  }
  
  return matches;
};

// Генерация сетки double elimination
Tournament.prototype.generateDoubleEliminationBracket = function(participants) {
  const matches = [];
  const participantsCount = participants.length;
  
  // Winners bracket (как single elimination)
  const winnersMatches = this.generateSingleEliminationBracket(participants);
  matches.push(...winnersMatches);
  
  // Losers bracket (упрощенная версия)
  const losersRounds = Math.ceil(Math.log2(participantsCount));
  for (let round = 1; round <= losersRounds; round++) {
    const matchesInRound = Math.ceil(participantsCount / Math.pow(2, round));
    for (let pos = 0; pos < matchesInRound; pos++) {
      matches.push({
        round: round + 100, // Используем 100+ для losers bracket
        position: pos,
        participant1_id: null,
        participant2_id: null
      });
    }
  }
  
  return matches;
};

// Генерация сетки round robin
Tournament.prototype.generateRoundRobinBracket = function(participants) {
  const matches = [];
  const participantsCount = participants.length;
  
  // Каждый играет с каждым
  for (let i = 0; i < participantsCount; i++) {
    for (let j = i + 1; j < participantsCount; j++) {
      matches.push({
        round: 1,
        position: matches.length,
        participant1_id: participants[i].id,
        participant2_id: participants[j].id
      });
    }
  }
  
  return matches;
};

// Генерация сетки swiss
Tournament.prototype.generateSwissBracket = function(participants) {
  const matches = [];
  const participantsCount = participants.length;
  const rounds = Math.ceil(Math.log2(participantsCount));
  
  // Первый раунд - случайные пары
  for (let i = 0; i < participantsCount / 2; i++) {
    matches.push({
      round: 1,
      position: i,
      participant1_id: participants[i * 2].id,
      participant2_id: participants[i * 2 + 1] ? participants[i * 2 + 1].id : null
    });
  }
  
  // Последующие раунды будут генерироваться по мере необходимости
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.ceil(participantsCount / 2);
    for (let pos = 0; pos < matchesInRound; pos++) {
      matches.push({
        round,
        position: pos,
        participant1_id: null,
        participant2_id: null
      });
    }
  }
  
  return matches;
};

// Метод для продвижения победителя в следующий матч
Tournament.prototype.advanceWinner = async function(matchId, winnerId) {
  const match = await sequelize.models.TournamentMatch.findByPk(matchId);
  if (!match || match.tournament_id !== this.id) {
    throw new Error('Match not found or does not belong to this tournament');
  }

  // Завершаем текущий матч
  await match.completeMatch(winnerId);

  // Находим следующий матч
  const nextMatch = await sequelize.models.TournamentMatch.getNextMatch(
    this.id, 
    match.round, 
    match.position
  );

  if (nextMatch) {
    // Определяем, в какую позицию поместить победителя
    if (!nextMatch.participant1_id) {
      await nextMatch.update({ participant1_id: winnerId });
    } else if (!nextMatch.participant2_id) {
      await nextMatch.update({ participant2_id: winnerId });
    }

    // Проверяем, можно ли начать следующий матч
    if (nextMatch.participant1_id && nextMatch.participant2_id) {
      await nextMatch.update({ status: 'pending' });
    }
  } else {
    // Это финальный матч - завершаем турнир
    await this.complete(winnerId);
  }

  return { match, nextMatch };
};

// Метод для получения текущего состояния турнира
Tournament.prototype.getTournamentState = async function() {
  const matches = await sequelize.models.TournamentMatch.getMatchesByTournament(this.id);
  const participants = await sequelize.models.GameParticipant.findAll({
    where: { tournament_id: this.id },
    include: [
      {
        model: sequelize.models.User,
        as: 'User',
        attributes: ['id', 'display_name', 'first_name', 'avatarUrl']
      }
    ]
  });

  return {
    tournament: this,
    matches: matches.map(m => m.getMatchInfo()),
    participants,
    currentRound: Math.max(...matches.map(m => m.round)),
    totalRounds: Math.max(...matches.map(m => m.round))
  };
};

module.exports = Tournament;
