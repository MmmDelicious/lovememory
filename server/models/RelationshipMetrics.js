const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RelationshipMetrics = sequelize.define('RelationshipMetrics', {
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
  partner_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
  },
  scores: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      words: 0,
      acts: 0,
      gifts: 0,
      time: 0,
      touch: 0
    },
  },
  heat_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 50.0,
    validate: {
      min: 0,
      max: 100
    },
  },
  love_language_primary: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [['words', 'acts', 'gifts', 'time', 'touch']]
    },
  },
  love_language_secondary: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [['words', 'acts', 'gifts', 'time', 'touch']]
    },
  },
  attachment_style: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [['secure', 'anxious', 'avoidant', 'fearful']]
    },
  },
  relationship_stage: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'new',
    validate: {
      isIn: [['new', 'developing', 'established', 'mature']]
    },
  },
  last_activity_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  weekly_activity_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  monthly_activity_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  }
}, {
  tableName: 'relationship_metrics',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'partner_id']
    }
  ]
});

// Методы для работы с метриками
RelationshipMetrics.prototype.updateScore = function(category, points) {
  const currentScores = this.scores || {};
  currentScores[category] = (currentScores[category] || 0) + points;
  this.scores = currentScores;
  return this.save();
};

RelationshipMetrics.prototype.getPrimaryLanguage = function() {
  if (!this.scores) return null;
  
  const scores = this.scores;
  let maxScore = -1;
  let primaryLanguage = null;
  
  for (const [language, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryLanguage = language;
    }
  }
  
  return primaryLanguage;
};

RelationshipMetrics.prototype.getAverageScores = function(partnerMetrics) {
  if (!partnerMetrics || !this.scores || !partnerMetrics.scores) {
    return this.scores || {};
  }
  
  const avgScores = {};
  const languages = ['words', 'acts', 'gifts', 'time', 'touch'];
  
  for (const lang of languages) {
    const userScore = this.scores[lang] || 0;
    const partnerScore = partnerMetrics.scores[lang] || 0;
    avgScores[lang] = (userScore + partnerScore) / 2;
  }
  
  return avgScores;
};

RelationshipMetrics.associate = (models) => {
  RelationshipMetrics.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User'
  });
  
  RelationshipMetrics.belongsTo(models.User, {
    foreignKey: 'partner_id',
    as: 'Partner'
  });
  
  RelationshipMetrics.hasMany(models.PairDailyLesson, {
    foreignKey: 'relationship_id',
    as: 'DailyLessons'
  });
};

module.exports = RelationshipMetrics;
