const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Pair = sequelize.define('Pair', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user1Id: {
    type: DataTypes.UUID,
    allowNull: true, // Делаем nullable для новой архитектуры
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  user2Id: {
    type: DataTypes.UUID,
    allowNull: true, // Делаем nullable для новой архитектуры
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'active'),
    defaultValue: 'pending',
    allowNull: false,
  },
  // Новые поля согласно целевой архитектуре
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  harmony_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
});
Pair.associate = (models) => {
  Pair.belongsTo(models.User, {
    as: 'Requester',
    foreignKey: 'user1Id',
  });
  Pair.belongsTo(models.User, {
    as: 'Receiver',
    foreignKey: 'user2Id',
  });
  // Новая ассоциация many-to-many через UserPair
  Pair.hasMany(models.UserPair, {
    foreignKey: 'pair_id',
    as: 'UserPairs',
    onDelete: 'CASCADE',
  });
  // Ассоциация с событиями
  Pair.hasMany(models.Event, {
    foreignKey: 'pair_id',
    as: 'Events',
    onDelete: 'SET NULL',
  });
  // Ассоциация с медиа
  Pair.hasMany(models.Media, {
    foreignKey: 'pair_id',
    as: 'Media',
    onDelete: 'SET NULL',
  });
  // Ассоциация с игровыми комнатами
  Pair.hasMany(models.GameRoom, {
    foreignKey: 'pair_id',
    as: 'GameRooms',
    onDelete: 'SET NULL',
  });
  // Ассоциация с транзакциями
  Pair.hasMany(models.Transaction, {
    foreignKey: 'pair_id',
    as: 'Transactions',
    onDelete: 'CASCADE',
  });
  // Ассоциация с подарками
  Pair.hasMany(models.Gift, {
    foreignKey: 'recipient_pair_id',
    as: 'ReceivedGifts',
    onDelete: 'SET NULL',
  });
  // Ассоциация с инсайтами
  Pair.hasMany(models.Insight, {
    foreignKey: 'pair_id',
    as: 'Insights',
    onDelete: 'CASCADE',
  });
  // Ассоциация с прогрессом уроков
  Pair.hasMany(models.UserLessonProgress, {
    foreignKey: 'pair_id',
    as: 'LessonProgress',
    onDelete: 'CASCADE',
  });
  // Ассоциация с достижениями
  Pair.hasMany(models.Achievement, {
    foreignKey: 'pair_id',
    as: 'Achievements',
    onDelete: 'CASCADE',
  });
  // Ассоциация с сессиями
  Pair.hasMany(models.Session, {
    foreignKey: 'pair_id',
    as: 'Sessions',
    onDelete: 'CASCADE',
  });
};
module.exports = Pair;
