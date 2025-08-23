const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pair_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Pairs',
      key: 'id',
    },
  },
  session_type: {
    type: DataTypes.ENUM('learning', 'gaming', 'discussion', 'exercise', 'meditation', 'planning', 'date', 'activity'),
    allowNull: false,
    defaultValue: 'activity',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'active',
  },
  quality_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  participants: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  goals: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  achievements: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  created_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
}, {
  tableName: 'sessions',
  indexes: [
    {
      fields: ['pair_id'],
      name: 'idx_sessions_pair'
    },
    {
      fields: ['session_type'],
      name: 'idx_sessions_type'
    },
    {
      fields: ['status'],
      name: 'idx_sessions_status'
    },
    {
      fields: ['started_at'],
      name: 'idx_sessions_started'
    },
    {
      fields: ['pair_id', 'started_at'],
      name: 'idx_sessions_pair_started'
    }
  ]
});

// Ассоциации
Session.associate = (models) => {
  Session.belongsTo(models.Pair, {
    foreignKey: 'pair_id',
    as: 'Pair',
    onDelete: 'CASCADE'
  });
  Session.belongsTo(models.User, {
    foreignKey: 'created_by_user_id',
    as: 'Creator',
    onDelete: 'SET NULL'
  });
};

// Статические методы для работы с сессиями
Session.startSession = async function(pairId, createdByUserId, sessionData) {
  try {
    const session = await this.create({
      pair_id: pairId,
      created_by_user_id: createdByUserId,
      session_type: sessionData.session_type || 'activity',
      title: sessionData.title,
      description: sessionData.description,
      started_at: new Date(),
      participants: sessionData.participants || [],
      goals: sessionData.goals || [],
      metadata: sessionData.metadata || {},
      status: 'active'
    });

    return session;
  } catch (error) {
    console.error('Error starting session:', error);
    throw error;
  }
};

Session.getActiveSessions = async function(pairId = null) {
  const where = { status: 'active' };
  if (pairId) {
    where.pair_id = pairId;
  }

  return await this.findAll({
    where,
    include: [
      {
        model: sequelize.models.Pair,
        as: 'Pair',
        attributes: ['id', 'name', 'harmony_index']
      },
      {
        model: sequelize.models.User,
        as: 'Creator',
        attributes: ['id', 'display_name', 'first_name']
      }
    ],
    order: [['started_at', 'DESC']]
  });
};

Session.getSessionsForPair = async function(pairId, options = {}) {
  const where = { pair_id: pairId };
  
  if (options.session_type) {
    where.session_type = options.session_type;
  }
  
  if (options.status) {
    where.status = options.status;
  }

  if (options.from_date) {
    where.started_at = { [Op.gte]: options.from_date };
  }

  return await this.findAll({
    where,
    include: [
      {
        model: sequelize.models.User,
        as: 'Creator',
        attributes: ['id', 'display_name', 'first_name']
      }
    ],
    order: [['started_at', 'DESC']],
    limit: options.limit || 50
  });
};

Session.getSessionStats = async function(pairId, timeframe = 'month') {
  const now = new Date();
  let fromDate;

  switch (timeframe) {
    case 'week':
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const sessions = await this.findAll({
    where: {
      pair_id: pairId,
      started_at: { [Op.gte]: fromDate },
      status: 'completed'
    },
    attributes: ['session_type', 'duration_minutes', 'quality_rating']
  });

  // Группируем статистику по типам
  const stats = {};
  let totalMinutes = 0;
  let totalSessions = sessions.length;
  let averageRating = 0;

  sessions.forEach(session => {
    const type = session.session_type;
    if (!stats[type]) {
      stats[type] = { count: 0, minutes: 0, ratings: [] };
    }
    
    stats[type].count++;
    if (session.duration_minutes) {
      stats[type].minutes += session.duration_minutes;
      totalMinutes += session.duration_minutes;
    }
    if (session.quality_rating) {
      stats[type].ratings.push(session.quality_rating);
    }
  });

  // Вычисляем средние рейтинги
  Object.keys(stats).forEach(type => {
    const ratings = stats[type].ratings;
    stats[type].averageRating = ratings.length > 0 
      ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
      : null;
  });

  // Общий средний рейтинг
  const allRatings = sessions.filter(s => s.quality_rating).map(s => s.quality_rating);
  averageRating = allRatings.length > 0 
    ? (allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(1)
    : null;

  return {
    timeframe,
    totalSessions,
    totalMinutes,
    averageRating,
    typeStats: stats,
    period: {
      from: fromDate,
      to: now
    }
  };
};

// Методы экземпляра
Session.prototype.pause = async function() {
  if (this.status !== 'active') {
    throw new Error('Can only pause active sessions');
  }
  
  await this.update({ status: 'paused' });
  return this;
};

Session.prototype.resume = async function() {
  if (this.status !== 'paused') {
    throw new Error('Can only resume paused sessions');
  }
  
  await this.update({ status: 'active' });
  return this;
};

Session.prototype.complete = async function(completionData = {}) {
  if (!['active', 'paused'].includes(this.status)) {
    throw new Error('Can only complete active or paused sessions');
  }

  const endTime = new Date();
  const durationMinutes = Math.round((endTime - this.started_at) / (1000 * 60));

  const updateData = {
    status: 'completed',
    ended_at: endTime,
    duration_minutes: durationMinutes
  };

  if (completionData.quality_rating) {
    updateData.quality_rating = completionData.quality_rating;
  }

  if (completionData.achievements) {
    updateData.achievements = completionData.achievements;
  }

  if (completionData.notes) {
    updateData.notes = completionData.notes;
  }

  await this.update(updateData);
  return this;
};

Session.prototype.cancel = async function(reason = null) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel completed sessions');
  }

  const updateData = { status: 'cancelled' };
  if (reason) {
    updateData.metadata = { ...this.metadata, cancellation_reason: reason };
  }

  await this.update(updateData);
  return this;
};

Session.prototype.addGoal = async function(goal) {
  const goals = [...this.goals, goal];
  await this.update({ goals });
  return this;
};

Session.prototype.addAchievement = async function(achievement) {
  const achievements = [...this.achievements, achievement];
  await this.update({ achievements });
  return this;
};

Session.prototype.updateProgress = async function(progressData) {
  const metadata = { 
    ...this.metadata, 
    progress: {
      ...this.metadata.progress,
      ...progressData,
      updated_at: new Date()
    }
  };
  
  await this.update({ metadata });
  return this;
};

Session.prototype.getDuration = function() {
  if (this.duration_minutes) {
    return this.duration_minutes;
  }
  
  if (this.ended_at) {
    return Math.round((this.ended_at - this.started_at) / (1000 * 60));
  }
  
  if (this.status === 'active') {
    return Math.round((new Date() - this.started_at) / (1000 * 60));
  }
  
  return 0;
};

Session.prototype.getDisplayInfo = function() {
  return {
    id: this.id,
    title: this.title,
    type: this.session_type,
    status: this.status,
    duration: this.getDuration(),
    rating: this.quality_rating,
    goals: this.goals.length,
    achievements: this.achievements.length,
    started: this.started_at,
    ended: this.ended_at
  };
};

module.exports = Session;
