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

// Методы для работы с прогрессом
UserLessonProgress.prototype.calculateTotalReward = function() {
  return this.coins_earned + this.streak_bonus;
};

// Статические методы
UserLessonProgress.getUserStreak = async function(userId) {
  const Op = sequelize.Sequelize.Op;
  
  // Получаем все записи пользователя, отсортированные по дате убывания
  const progress = await this.findAll({
    where: { user_id: userId },
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
      // Пропуск одного дня допустим для streak
      streak++;
      currentDate = new Date(recordDate);
    } else {
      break;
    }
  }
  
  return streak;
};

UserLessonProgress.getWeeklyProgress = async function(userId, weekOffset = 0) {
  const Op = sequelize.Sequelize.Op;
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - (weekOffset * 7));
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return await this.findAll({
    where: {
      user_id: userId,
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

UserLessonProgress.getThemeProgress = async function(userId, theme) {
  return await this.findAll({
    where: { user_id: userId },
    include: [{
      model: sequelize.models.Lesson,
      as: 'Lesson',
      where: { theme: theme }
    }],
    order: [['completed_at', 'ASC']]
  });
};

UserLessonProgress.getCompletionStats = async function(userId) {
  const Op = sequelize.Sequelize.Op;
  
  // Общее количество завершенных уроков
  const totalCompleted = await this.count({
    where: { user_id: userId }
  });
  
  // Количество за последние 30 дней
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const completedLast30Days = await this.count({
    where: {
      user_id: userId,
      completed_at: {
        [Op.gte]: thirtyDaysAgo
      }
    }
  });
  
  // Общая сумма заработанных монет
  const totalCoinsEarned = await this.sum('coins_earned', {
    where: { user_id: userId }
  }) || 0;
  
  const totalStreakBonus = await this.sum('streak_bonus', {
    where: { user_id: userId }
  }) || 0;
  
  return {
    totalCompleted,
    completedLast30Days,
    totalCoinsEarned,
    totalStreakBonus,
    totalReward: totalCoinsEarned + totalStreakBonus
  };
};

UserLessonProgress.associate = (models) => {
  UserLessonProgress.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User'
  });
  
  UserLessonProgress.belongsTo(models.User, {
    foreignKey: 'partner_id',
    as: 'Partner'
  });
  
  UserLessonProgress.belongsTo(models.Lesson, {
    foreignKey: 'lesson_id',
    as: 'Lesson'
  });
};

module.exports = UserLessonProgress;
