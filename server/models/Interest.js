const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interest = sequelize.define('Interest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 100],
    },
  },
  category: {
    type: DataTypes.ENUM(
      'food',          // Еда
      'cinema',        // Кино
      'hobby',         // Хобби
      'sport',         // Спорт
      'travel',        // Путешествия
      'music',         // Музыка
      'art',           // Искусство
      'books',         // Книги
      'games',         // Игры
      'nature',        // Природа
      'technology',    // Технологии
      'fashion',       // Мода
      'cooking',       // Готовка
      'fitness',       // Фитнес
      'photography',   // Фотография
      'dancing',       // Танцы
      'shopping',      // Шоппинг
      'animals',       // Животные
      'cars',          // Автомобили
      'crafts',        // Рукоделие
      'education',     // Образование
      'volunteering',  // Волонтерство
      'other'          // Другое
    ),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  emoji: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [1, 10], // Эмодзи для UI
    },
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  popularity_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Счетчик популярности для сортировки',
  },
}, {
  tableName: 'interests',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['category'],
      name: 'idx_interests_category'
    },
    {
      fields: ['name'],
      name: 'idx_interests_name'
    },
    {
      fields: ['is_active'],
      name: 'idx_interests_active'
    },
    {
      fields: ['popularity_score'],
      name: 'idx_interests_popularity'
    }
  ]
});

Interest.associate = (models) => {
  Interest.hasMany(models.UserInterest, {
    foreignKey: 'interest_id',
    as: 'UserInterests',
    onDelete: 'CASCADE',
  });
};

// Статические методы
Interest.getByCategory = async function(category) {
  return await this.findAll({
    where: { 
      category,
      is_active: true 
    },
    order: [['popularity_score', 'DESC'], ['name', 'ASC']]
  });
};

Interest.getPopular = async function(limit = 20) {
  return await this.findAll({
    where: { is_active: true },
    order: [['popularity_score', 'DESC']],
    limit
  });
};

Interest.incrementPopularity = async function(interestId) {
  return await this.increment('popularity_score', {
    where: { id: interestId }
  });
};

module.exports = Interest;
