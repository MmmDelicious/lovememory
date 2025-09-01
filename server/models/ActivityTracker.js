const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityTracker = sequelize.define('ActivityTracker', {
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
    allowNull: true,
    references: {
      model: 'Pairs',
      key: 'id',
    },
  },
  // Основные метрики активности
  daily_steps: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Количество шагов за день'
  },
  weekly_goal: {
    type: DataTypes.INTEGER,
    defaultValue: 10000,
    comment: 'Цель по шагам на неделю'
  },
  daily_goal: {
    type: DataTypes.INTEGER,
    defaultValue: 10000,
    comment: 'Цель по шагам на день'
  },
  // Дополнительные метрики
  calories_burned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Сожженные калории'
  },
  active_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Активные минуты'
  },
  distance_km: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Пройденное расстояние в км'
  },
  // Статистика по дням
  current_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Текущая серия дней с достижением цели'
  },
  longest_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Самая длинная серия дней'
  },
  total_days_active: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Общее количество активных дней'
  },
  // Достижения
  achievements: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Массив полученных достижений'
  },
  // Настройки
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      notifications: true,
      autoSync: true,
      privacy: 'public',
      goalAdjustment: 'auto'
    },
    comment: 'Настройки трекера'
  },
  // Метаданные
  last_sync: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Последняя синхронизация'
  },
  data_source: {
    type: DataTypes.STRING,
    defaultValue: 'manual',
    comment: 'Источник данных: manual, health_kit, google_fit, etc.'
  }
}, {
  tableName: 'activity_trackers',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id', 'created_at'],
      name: 'idx_activity_tracker_user_created'
    },
    {
      fields: ['pair_id', 'created_at'],
      name: 'idx_activity_tracker_pair_created'
    },
    {
      fields: ['daily_steps'],
      name: 'idx_activity_tracker_steps'
    }
  ]
});

// Статические методы
ActivityTracker.findOrCreateByUserId = async function(userId, pairId = null) {
  const [tracker, created] = await this.findOrCreate({
    where: { user_id: userId },
    defaults: {
      user_id: userId,
      pair_id: pairId,
      daily_steps: 0,
      weekly_goal: 10000,
      daily_goal: 10000
    }
  });
  return { tracker, created };
};

// Методы для обновления активности
ActivityTracker.updateDailyActivity = async function(userId, activityData) {
  const tracker = await this.findOne({ where: { user_id: userId } });
  if (!tracker) return null;

  const {
    steps = 0,
    calories = 0,
    activeMinutes = 0,
    distance = 0
  } = activityData;

  // Обновляем метрики
  tracker.daily_steps = steps;
  tracker.calories_burned = calories;
  tracker.active_minutes = activeMinutes;
  tracker.distance_km = distance;
  tracker.last_sync = new Date();

  // Проверяем достижение цели
  const goalAchieved = steps >= tracker.daily_goal;
  
  // Обновляем статистику
  if (goalAchieved) {
    tracker.current_streak += 1;
    tracker.total_days_active += 1;
    
    if (tracker.current_streak > tracker.longest_streak) {
      tracker.longest_streak = tracker.current_streak;
    }
  } else {
    tracker.current_streak = 0;
  }

  await tracker.save();
  return tracker;
};

// Методы для получения статистики
ActivityTracker.getWeeklyStats = async function(userId) {
  const tracker = await this.findOne({ where: { user_id: userId } });
  if (!tracker) return null;

  // Здесь можно добавить логику для получения статистики за неделю
  // Пока возвращаем базовые данные
  return {
    currentSteps: tracker.daily_steps,
    weeklyGoal: tracker.weekly_goal,
    dailyGoal: tracker.daily_goal,
    currentStreak: tracker.current_streak,
    longestStreak: tracker.longest_streak,
    totalDaysActive: tracker.total_days_active,
    goalProgress: Math.round((tracker.daily_steps / tracker.daily_goal) * 100)
  };
};

// Ассоциации
ActivityTracker.associate = (models) => {
  ActivityTracker.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User',
    onDelete: 'CASCADE'
  });
  
  ActivityTracker.belongsTo(models.Pair, {
    foreignKey: 'pair_id',
    as: 'Pair',
    onDelete: 'SET NULL'
  });
};

module.exports = ActivityTracker;
