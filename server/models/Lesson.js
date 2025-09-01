const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  source: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  triggers: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  effect: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  theme: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  interactive_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'prompt',
    validate: {
      isIn: [['prompt', 'quiz', 'chat', 'photo', 'choice']]
    },
  },
  difficulty_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 5
    },
  },
  required_streak: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  animation_file: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  base_coins_reward: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
}, {
  tableName: 'lessons',
  timestamps: false  // Отключаем timestamps для модели Lesson
});
Lesson.prototype.checkTriggers = function(relationshipMetrics, userStreak = 0, gapDays = 0) {
  if (!this.triggers || Object.keys(this.triggers).length === 0) {
    return true; // Если нет условий, урок подходит всегда
  }
  const triggers = this.triggers;
  if (triggers.love_language && Array.isArray(triggers.love_language)) {
    const userPrimaryLanguage = relationshipMetrics.love_language_primary;
    if (userPrimaryLanguage && !triggers.love_language.includes(userPrimaryLanguage)) {
      return false;
    }
  }
  if (triggers.context && Array.isArray(triggers.context)) {
    if (triggers.context.includes('low_heat') && relationshipMetrics.heat_score >= 70) {
      return false;
    }
    if (triggers.context.includes('high_heat') && relationshipMetrics.heat_score < 70) {
      return false;
    }
  }
  if (triggers.gap_days && Array.isArray(triggers.gap_days)) {
    const [minGap, maxGap] = triggers.gap_days;
    if (typeof minGap === 'number' && gapDays < minGap) {
      return false;
    }
    if (maxGap === 'more' && gapDays <= minGap) {
      return false;
    }
    if (typeof maxGap === 'number' && gapDays > maxGap) {
      return false;
    }
  }
  if (triggers.relationship_stage && Array.isArray(triggers.relationship_stage)) {
    if (!triggers.relationship_stage.includes(relationshipMetrics.relationship_stage)) {
      return false;
    }
  }
  if (triggers.min_streak && userStreak < triggers.min_streak) {
    return false;
  }
  return true;
};
Lesson.prototype.calculateMatchScore = function(relationshipMetrics, userStreak = 0, gapDays = 0) {
  let score = 0;
  const userPrimaryLanguage = relationshipMetrics.love_language_primary;
  if (userPrimaryLanguage && this.theme.includes(userPrimaryLanguage)) {
    score += 60;
  } else if (userPrimaryLanguage && this.tags && this.tags.includes(userPrimaryLanguage)) {
    score += 40;
  }
  if (this.effect && this.effect.heat && relationshipMetrics.heat_score < 50) {
    score += 30;
  }
  score += Math.random() * 10;
  return score;
};
Lesson.prototype.applyEffects = function(relationshipMetrics) {
  if (!this.effect || Object.keys(this.effect).length === 0) {
    return relationshipMetrics;
  }
  const effect = this.effect;
  if (effect.words) {
    relationshipMetrics.updateScore('words', effect.words);
  }
  if (effect.acts) {
    relationshipMetrics.updateScore('acts', effect.acts);
  }
  if (effect.gifts) {
    relationshipMetrics.updateScore('gifts', effect.gifts);
  }
  if (effect.time) {
    relationshipMetrics.updateScore('time', effect.time);
  }
  if (effect.touch) {
    relationshipMetrics.updateScore('touch', effect.touch);
  }
  if (effect.heat) {
    const newHeatScore = Math.min(100, Math.max(0, relationshipMetrics.heat_score + effect.heat));
    relationshipMetrics.heat_score = newHeatScore;
  }
  return relationshipMetrics;
};
Lesson.findByTheme = function(theme, options = {}) {
  return this.findAll({
    where: {
      theme: theme,
      is_active: true,
      ...options.where
    },
    ...options
  });
};
Lesson.findByTags = function(tags, options = {}) {
  return this.findAll({
    where: {
      tags: {
        [sequelize.Sequelize.Op.overlap]: tags
      },
      is_active: true,
      ...options.where
    },
    ...options
  });
};
Lesson.associate = (models) => {
  Lesson.hasMany(models.UserLessonProgress, {
    foreignKey: 'lesson_id',
    as: 'UserProgress'
  });
  Lesson.hasMany(models.PairDailyLesson, {
    foreignKey: 'lesson_id',
    as: 'DailyAssignments'
  });
};
module.exports = Lesson;

