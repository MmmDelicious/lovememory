const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PairDailyLesson = sequelize.define('PairDailyLesson', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  relationship_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'relationship_metrics',
      key: 'id'
    },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  lesson_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'lessons',
      key: 'id'
    },
  },
  user_completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  partner_completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  user_completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  partner_completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  selection_algorithm_version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'v1.0',
  },
  selection_score: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  selection_metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  }
}, {
  tableName: 'pair_daily_lessons',
  indexes: [
    {
      unique: true,
      fields: ['relationship_id', 'date']
    }
  ]
});

// Методы для работы с ежедневными уроками пар
PairDailyLesson.prototype.markCompleted = function(userId, relationshipMetrics) {
  const isUser = relationshipMetrics.user_id === userId;
  const isPartner = relationshipMetrics.partner_id === userId;
  
  if (isUser) {
    this.user_completed = true;
    this.user_completed_at = new Date();
  } else if (isPartner) {
    this.partner_completed = true;
    this.partner_completed_at = new Date();
  } else {
    throw new Error('User is not part of this relationship');
  }
  
  return this.save();
};

PairDailyLesson.prototype.isBothCompleted = function() {
  return this.user_completed && this.partner_completed;
};

PairDailyLesson.prototype.getCompletionStatus = function(userId, relationshipMetrics) {
  const isUser = relationshipMetrics.user_id === userId;
  
  if (isUser) {
    return {
      userCompleted: this.user_completed,
      partnerCompleted: this.partner_completed,
      userCompletedAt: this.user_completed_at,
      partnerCompletedAt: this.partner_completed_at
    };
  } else {
    return {
      userCompleted: this.partner_completed,
      partnerCompleted: this.user_completed,
      userCompletedAt: this.partner_completed_at,
      partnerCompletedAt: this.user_completed_at
    };
  }
};

// Статические методы
PairDailyLesson.getTodaysLesson = async function(relationshipId, date = null) {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  return await this.findOne({
    where: {
      relationship_id: relationshipId,
      date: targetDate
    },
    include: [{
      model: sequelize.models.Lesson,
      as: 'Lesson'
    }, {
      model: sequelize.models.RelationshipMetrics,
      as: 'Relationship'
    }]
  });
};

PairDailyLesson.getWeeklyLessons = async function(relationshipId, weekOffset = 0) {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - (weekOffset * 7));
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  
  const Op = sequelize.Sequelize.Op;
  
  return await this.findAll({
    where: {
      relationship_id: relationshipId,
      date: {
        [Op.between]: [
          startOfWeek.toISOString().split('T')[0],
          endOfWeek.toISOString().split('T')[0]
        ]
      }
    },
    include: [{
      model: sequelize.models.Lesson,
      as: 'Lesson'
    }],
    order: [['date', 'ASC']]
  });
};

PairDailyLesson.getCompletionStreak = async function(relationshipId) {
  const Op = sequelize.Sequelize.Op;
  
  const lessons = await this.findAll({
    where: { relationship_id: relationshipId },
    order: [['date', 'DESC']],
    raw: true
  });
  
  if (lessons.length === 0) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const lesson of lessons) {
    const lessonDate = new Date(lesson.date);
    const daysDiff = Math.floor((currentDate - lessonDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak && lesson.user_completed && lesson.partner_completed) {
      streak++;
      currentDate = new Date(lessonDate);
    } else if (daysDiff === streak + 1 && lesson.user_completed && lesson.partner_completed) {
      streak++;
      currentDate = new Date(lessonDate);
    } else {
      break;
    }
  }
  
  return streak;
};

PairDailyLesson.getProgressStats = async function(relationshipId) {
  const Op = sequelize.Sequelize.Op;
  
  // Общее количество назначенных уроков
  const totalAssigned = await this.count({
    where: { relationship_id: relationshipId }
  });
  
  // Количество полностью завершенных (обоими партнерами)
  const fullyCompleted = await this.count({
    where: {
      relationship_id: relationshipId,
      user_completed: true,
      partner_completed: true
    }
  });
  
  // Статистика за последние 30 дней
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentAssigned = await this.count({
    where: {
      relationship_id: relationshipId,
      date: {
        [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0]
      }
    }
  });
  
  const recentCompleted = await this.count({
    where: {
      relationship_id: relationshipId,
      user_completed: true,
      partner_completed: true,
      date: {
        [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0]
      }
    }
  });
  
  return {
    totalAssigned,
    fullyCompleted,
    completionRate: totalAssigned > 0 ? (fullyCompleted / totalAssigned) * 100 : 0,
    recentAssigned,
    recentCompleted,
    recentCompletionRate: recentAssigned > 0 ? (recentCompleted / recentAssigned) * 100 : 0
  };
};

PairDailyLesson.associate = (models) => {
  PairDailyLesson.belongsTo(models.RelationshipMetrics, {
    foreignKey: 'relationship_id',
    as: 'Relationship'
  });
  
  PairDailyLesson.belongsTo(models.Lesson, {
    foreignKey: 'lesson_id',
    as: 'Lesson'
  });
};

module.exports = PairDailyLesson;
