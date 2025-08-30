const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecommendationFeedback = sequelize.define('RecommendationFeedback', {
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
    allowNull: false,
    references: {
      model: 'Pairs',
      key: 'id',
    },
  },
  entity_type: {
    type: DataTypes.ENUM(
      'place',           // Место (ресторан, кафе, парк)
      'activity',        // Активность (кино, театр, спорт)
      'event',           // Событие
      'insight',         // Инсайт/совет
      'date_idea',       // Идея свидания
      'gift',            // Подарок
      'lesson',          // Урок/задание
      'game',            // Игра
      'other'            // Другое
    ),
    allowNull: false,
  },
  entity_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'ID сущности (может быть UUID, ID из Яндекс.Карт, etc.)',
  },
  entity_data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Данные о сущности (название, описание, координаты)',
  },
  value: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10,
    },
    comment: 'Оценка от 1 до 10',
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Текстовый комментарий пользователя',
  },
  recommendation_context: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Контекст рекомендации (алгоритм, триггеры, параметры)',
  },
  feedback_type: {
    type: DataTypes.ENUM('rating', 'visited', 'not_visited', 'cancelled'),
    allowNull: false,
    defaultValue: 'rating',
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  recommendation_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Когда была дана рекомендация',
  },
  visit_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Когда состоялось событие/посещение',
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
    comment: 'Теги для категоризации фидбэка',
  },
}, {
  tableName: 'recommendation_feedback',
  indexes: [
    {
      fields: ['user_id'],
      name: 'idx_feedback_user'
    },
    {
      fields: ['pair_id'],
      name: 'idx_feedback_pair'
    },
    {
      fields: ['entity_type'],
      name: 'idx_feedback_entity_type'
    },
    {
      fields: ['entity_id'],
      name: 'idx_feedback_entity_id'
    },
    {
      fields: ['value'],
      name: 'idx_feedback_value'
    },
    {
      fields: ['feedback_type'],
      name: 'idx_feedback_type'
    },
    {
      fields: ['submitted_at'],
      name: 'idx_feedback_submitted'
    },
    {
      fields: ['pair_id', 'entity_type', 'submitted_at'],
      name: 'idx_feedback_pair_type_date'
    }
  ]
});

RecommendationFeedback.associate = (models) => {
  RecommendationFeedback.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User',
    onDelete: 'CASCADE'
  });
  
  RecommendationFeedback.belongsTo(models.Pair, {
    foreignKey: 'pair_id',
    as: 'Pair',
    onDelete: 'CASCADE'
  });
};

// Статические методы
RecommendationFeedback.getForPair = async function(pairId, entityType = null, limit = 50) {
  const where = { pair_id: pairId };
  if (entityType) {
    where.entity_type = entityType;
  }
  
  return await this.findAll({
    where,
    include: [{
      model: sequelize.models.User,
      as: 'User',
      attributes: ['id', 'first_name', 'display_name']
    }],
    order: [['submitted_at', 'DESC']],
    limit
  });
};

RecommendationFeedback.getAverageRating = async function(entityType, entityId) {
  const result = await this.aggregate('value', 'AVG', {
    where: {
      entity_type: entityType,
      entity_id: entityId,
      feedback_type: 'rating'
    }
  });
  
  return result ? Math.round(result * 100) / 100 : null;
};

RecommendationFeedback.getStatsByType = async function(pairId, entityType) {
  const stats = await this.findAll({
    where: {
      pair_id: pairId,
      entity_type: entityType
    },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('value')), 'average_rating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_count'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN value >= 7 THEN 1 END')), 'positive_count'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN value <= 4 THEN 1 END')), 'negative_count']
    ],
    raw: true
  });
  
  return stats[0] || {
    average_rating: null,
    total_count: 0,
    positive_count: 0,
    negative_count: 0
  };
};

RecommendationFeedback.createFeedback = async function(feedbackData) {
  // Автоматически добавляем теги на основе оценки
  const tags = [];
  if (feedbackData.value >= 8) tags.push('excellent');
  else if (feedbackData.value >= 6) tags.push('good');
  else if (feedbackData.value >= 4) tags.push('average');
  else tags.push('poor');
  
  return await this.create({
    ...feedbackData,
    tags: [...(feedbackData.tags || []), ...tags]
  });
};

module.exports = RecommendationFeedback;
