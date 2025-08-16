const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventTemplate = sequelize.define('EventTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  event_type: {
    type: DataTypes.ENUM(
      'memory',      // воспоминания
      'plan',        // планы
      'anniversary', // годовщины
      'birthday',    // дни рождения
      'travel',      // путешествия
      'date',        // свидания
      'gift',        // подарки
      'deadline',    // дедлайны
      'custom'       // пользовательский тип
    ),
    defaultValue: 'custom',
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '#D97A6C',
    validate: {
      is: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    }
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 60,
    validate: {
      min: 5,
      max: 1440 // максимум 24 часа
    }
  },
  default_title: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 200]
    }
  },
  default_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_all_day: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_shared: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  default_recurrence_rule: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  }
}, {
  tableName: 'event_templates',
  indexes: [
    {
      fields: ['userId', 'is_active']
    },
    {
      fields: ['event_type']
    },
    {
      fields: ['usage_count']
    }
  ]
});

EventTemplate.associate = (models) => {
  EventTemplate.belongsTo(models.User, { foreignKey: 'userId' });
};

module.exports = EventTemplate;
