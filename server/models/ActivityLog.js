const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
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
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  payload: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'activity_logs',
  timestamps: false, // Используем только createdAt
  indexes: [
    {
      fields: ['pair_id', 'createdAt'],
      name: 'idx_activity_logs_pair_created'
    },
    {
      fields: ['user_id', 'createdAt'],
      name: 'idx_activity_logs_user_created'
    },
    {
      fields: ['action'],
      name: 'idx_activity_logs_action'
    },
    {
      fields: ['createdAt'],
      name: 'idx_activity_logs_created'
    }
  ]
});

ActivityLog.associate = (models) => {
  ActivityLog.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User',
    onDelete: 'SET NULL'
  });
  ActivityLog.belongsTo(models.Pair, {
    foreignKey: 'pair_id',
    as: 'Pair',
    onDelete: 'SET NULL'
  });
};

// Статические методы для логирования различных типов событий
ActivityLog.logEvent = async function(pairId, userId, action, payload = {}) {
  try {
    return await this.create({
      pair_id: pairId,
      user_id: userId,
      action,
      payload
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Не падаем, если логирование не удалось
    return null;
  }
};

// Методы для конкретных типов событий
ActivityLog.logEventCreated = function(pairId, userId, eventData) {
  return this.logEvent(pairId, userId, 'event_created', { event: eventData });
};

ActivityLog.logMediaUploaded = function(pairId, userId, mediaData) {
  return this.logEvent(pairId, userId, 'media_uploaded', { media: mediaData });
};

ActivityLog.logGameStarted = function(pairId, userId, gameData) {
  return this.logEvent(pairId, userId, 'game_started', { game: gameData });
};

ActivityLog.logUserLogin = function(pairId, userId) {
  return this.logEvent(pairId, userId, 'user_login', {});
};

ActivityLog.logLessonCompleted = function(pairId, userId, lessonId, timeSpent) {
  return this.logEvent(pairId, userId, 'lesson_completed', { 
    lesson_id: lessonId, 
    time_spent: timeSpent 
  });
};

module.exports = ActivityLog;
