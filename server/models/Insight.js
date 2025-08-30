const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Insight = sequelize.define('Insight', {
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
  insight_type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['compatibility', 'activity_pattern', 'recommendation', 'love_language', 'conflict_analysis', 'growth_opportunity']],
    },
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  model_version: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  generated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'insights',
  indexes: [
    {
      fields: ['pair_id'],
      name: 'idx_insights_pair'
    },
    {
      fields: ['insight_type'],
      name: 'idx_insights_type'
    },
    {
      fields: ['generated_at'],
      name: 'idx_insights_generated'
    },
    {
      fields: ['pair_id', 'generated_at'],
      name: 'idx_insights_pair_generated'
    }
  ]
});

Insight.associate = (models) => {
  Insight.belongsTo(models.Pair, {
    foreignKey: 'pair_id',
    as: 'Pair',
    onDelete: 'CASCADE'
  });
};

// Статические методы для создания инсайтов
Insight.createCompatibilityInsight = async function(pairId, compatibilityScore, details) {
  return await this.create({
    pair_id: pairId,
    insight_type: 'compatibility',
    summary: `Уровень совместимости: ${compatibilityScore}%`,
    details: { score: compatibilityScore, ...details },
    model_version: 'compatibility_v1.0'
  });
};

Insight.createActivityPatternInsight = async function(pairId, pattern, details) {
  return await this.create({
    pair_id: pairId,
    insight_type: 'activity_pattern',
    summary: `Обнаружен паттерн активности: ${pattern}`,
    details: { pattern, ...details },
    model_version: 'activity_pattern_v1.0'
  });
};

Insight.createRecommendation = async function(pairId, recommendation, details) {
  return await this.create({
    pair_id: pairId,
    insight_type: 'recommendation',
    summary: recommendation,
    details,
    model_version: 'recommendation_v1.0'
  });
};

// Получение последних инсайтов для пары
Insight.getLatestForPair = async function(pairId, limit = 10) {
  return await this.findAll({
    where: { pair_id: pairId },
    order: [['generated_at', 'DESC']],
    limit
  });
};

// Получение инсайтов по типу
Insight.getByType = async function(pairId, insightType, limit = 5) {
  return await this.findAll({
    where: { 
      pair_id: pairId,
      insight_type: insightType 
    },
    order: [['generated_at', 'DESC']],
    limit
  });
};

// Получение непрочитанных инсайтов
Insight.getUnread = async function(pairId, lastReadDate) {
  const whereCondition = { pair_id: pairId };
  if (lastReadDate) {
    whereCondition.generated_at = {
      [require('sequelize').Op.gt]: new Date(lastReadDate)
    };
  }
  
  return await this.findAll({
    where: whereCondition,
    order: [['generated_at', 'DESC']]
  });
};

// Пометить инсайты как прочитанные (не храним в БД, используем localStorage)
Insight.markAsRead = function(insightIds) {
  // Это будет обрабатываться на фронтенде через localStorage
  return { success: true, marked_count: insightIds.length };
};

module.exports = Insight;
