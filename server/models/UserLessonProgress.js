const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserLessonProgress = sequelize.define('UserLessonProgress', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
  },
  pair_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Pairs',
      key: 'id'
    },
  },
  completed_by_user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
  },
  lesson_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'lessons',
      key: 'id'
    },
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  coins_earned: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  streak_bonus: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  feedback: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  completion_time_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  partner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
  }
}, {
  tableName: 'user_lesson_progress'
});
UserLessonProgress.prototype.calculateTotalReward = function() {
  return this.coins_earned + this.streak_bonus;
};
// Получить streak для пары (общий для обоих пользователей)
UserLessonProgress.getPairStreak = async function(pairId) {
  const Op = sequelize.Sequelize.Op;
  const progress = await this.findAll({
    where: { pair_id: pairId },
    order: [['completed_at', 'DESC']],
    raw: true
  });
  if (progress.length === 0) return 0;
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  for (const record of progress) {
    const recordDate = new Date(record.completed_at);
    recordDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24));
    if (daysDiff === streak) {
      streak++;
      currentDate = new Date(recordDate);
    } else if (daysDiff === streak + 1) {
      streak++;
      currentDate = new Date(recordDate);
    } else {
      break;
    }
  }
  return streak;
};

// Получить streak для конкретного пользователя в паре
UserLessonProgress.getUserStreak = async function(userId, pairId = null) {
  const Op = sequelize.Sequelize.Op;
  const where = { completed_by_user_id: userId };
  if (pairId) where.pair_id = pairId;
  
  const progress = await this.findAll({
    where,
    order: [['completed_at', 'DESC']],
    raw: true
  });
  if (progress.length === 0) return 0;
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  for (const record of progress) {
    const recordDate = new Date(record.completed_at);
    recordDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24));
    if (daysDiff === streak) {
      streak++;
      currentDate = new Date(recordDate);
    } else if (daysDiff === streak + 1) {
      streak++;
      currentDate = new Date(recordDate);
    } else {
      break;
    }
  }
  return streak;
};
// Прогресс пары за неделю
UserLessonProgress.getPairWeeklyProgress = async function(pairId, weekOffset = 0) {
  const Op = sequelize.Sequelize.Op;
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - (weekOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return await this.findAll({
    where: {
      pair_id: pairId,
      completed_at: {
        [Op.between]: [startOfWeek, endOfWeek]
      }
    },
    include: [{
      model: sequelize.models.Lesson,
      as: 'Lesson'
    }],
    order: [['completed_at', 'ASC']]
  });
};

// Прогресс конкретного пользователя за неделю
UserLessonProgress.getWeeklyProgress = async function(userId, pairId = null, weekOffset = 0) {
  const Op = sequelize.Sequelize.Op;
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - (weekOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const where = {
    completed_by_user_id: userId,
    completed_at: {
      [Op.between]: [startOfWeek, endOfWeek]
    }
  };
  if (pairId) where.pair_id = pairId;
  
  return await this.findAll({
    where,
    include: [{
      model: sequelize.models.Lesson,
      as: 'Lesson'
    }],
    order: [['completed_at', 'ASC']]
  });
};
// Прогресс пары по теме
UserLessonProgress.getPairThemeProgress = async function(pairId, theme) {
  return await this.findAll({
    where: { pair_id: pairId },
    include: [{
      model: sequelize.models.Lesson,
      as: 'Lesson',
      where: { theme: theme }
    }],
    order: [['completed_at', 'ASC']]
  });
};

// Прогресс пользователя по теме
UserLessonProgress.getThemeProgress = async function(userId, theme, pairId = null) {
  const where = { completed_by_user_id: userId };
  if (pairId) where.pair_id = pairId;
  
  return await this.findAll({
    where,
    include: [{
      model: sequelize.models.Lesson,
      as: 'Lesson',
      where: { theme: theme }
    }],
    order: [['completed_at', 'ASC']]
  });
};
// Статистика завершения для пары
UserLessonProgress.getPairCompletionStats = async function(pairId) {
  const Op = sequelize.Sequelize.Op;
  const totalCompleted = await this.count({
    where: { pair_id: pairId }
  });
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const completedLast30Days = await this.count({
    where: {
      pair_id: pairId,
      completed_at: {
        [Op.gte]: thirtyDaysAgo
      }
    }
  });
  const totalCoinsEarned = await this.sum('coins_earned', {
    where: { pair_id: pairId }
  }) || 0;
  const totalStreakBonus = await this.sum('streak_bonus', {
    where: { pair_id: pairId }
  }) || 0;
  return {
    totalCompleted,
    completedLast30Days,
    totalCoinsEarned,
    totalStreakBonus,
    totalReward: totalCoinsEarned + totalStreakBonus
  };
};

// Статистика завершения для пользователя
UserLessonProgress.getCompletionStats = async function(userId, pairId = null) {
  const Op = sequelize.Sequelize.Op;
  const where = { completed_by_user_id: userId };
  if (pairId) where.pair_id = pairId;
  
  const totalCompleted = await this.count({ where });
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const completedLast30Days = await this.count({
    where: {
      ...where,
      completed_at: {
        [Op.gte]: thirtyDaysAgo
      }
    }
  });
  const totalCoinsEarned = await this.sum('coins_earned', { where }) || 0;
  const totalStreakBonus = await this.sum('streak_bonus', { where }) || 0;
  return {
    totalCompleted,
    completedLast30Days,
    totalCoinsEarned,
    totalStreakBonus,
    totalReward: totalCoinsEarned + totalStreakBonus
  };
};
UserLessonProgress.associate = (models) => {
  // Старые ассоциации для обратной совместимости
  UserLessonProgress.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User'
  });
  UserLessonProgress.belongsTo(models.User, {
    foreignKey: 'partner_id',
    as: 'Partner'
  });
  // Новые ассоциации для pair-centric модели
  UserLessonProgress.belongsTo(models.Pair, {
    foreignKey: 'pair_id',
    as: 'Pair'
  });
  UserLessonProgress.belongsTo(models.User, {
    foreignKey: 'completed_by_user_id',
    as: 'CompletedByUser'
  });
  UserLessonProgress.belongsTo(models.Lesson, {
    foreignKey: 'lesson_id',
    as: 'Lesson'
  });
};
module.exports = UserLessonProgress;

