const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserInterest = sequelize.define('UserInterest', {
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
  interest_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'interests',
      key: 'id',
    },
  },
  preference: {
    type: DataTypes.ENUM('love', 'like', 'neutral', 'dislike'),
    allowNull: false,
    defaultValue: 'like',
    comment: 'Отношение пользователя к интересу',
  },
  intensity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: {
      min: 1,
      max: 10,
    },
    comment: 'Интенсивность интереса от 1 до 10',
  },
  added_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  last_activity: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Последняя активность связанная с этим интересом',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Дополнительная информация (подкатегории, заметки)',
  },
}, {
  tableName: 'user_interests',
  indexes: [
    {
      fields: ['user_id'],
      name: 'idx_user_interests_user'
    },
    {
      fields: ['interest_id'],
      name: 'idx_user_interests_interest'
    },
    {
      fields: ['user_id', 'interest_id'],
      name: 'idx_user_interests_unique',
      unique: true
    },
    {
      fields: ['preference'],
      name: 'idx_user_interests_preference'
    },
    {
      fields: ['intensity'],
      name: 'idx_user_interests_intensity'
    }
  ]
});

UserInterest.associate = (models) => {
  UserInterest.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User',
    onDelete: 'CASCADE'
  });
  
  UserInterest.belongsTo(models.Interest, {
    foreignKey: 'interest_id',
    as: 'Interest',
    onDelete: 'CASCADE'
  });
};

// Статические методы
UserInterest.getForUser = async function(userId, preference = null) {
  const where = { user_id: userId };
  if (preference) {
    where.preference = preference;
  }
  
  return await this.findAll({
    where,
    include: [{
      model: sequelize.models.Interest,
      as: 'Interest',
      where: { is_active: true }
    }],
    order: [['intensity', 'DESC'], ['added_at', 'DESC']]
  });
};

UserInterest.findCommonInterests = async function(user1Id, user2Id) {
  const user1Interests = await this.findAll({
    where: { 
      user_id: user1Id,
      preference: ['love', 'like']
    },
    include: [{
      model: sequelize.models.Interest,
      as: 'Interest',
      where: { is_active: true }
    }]
  });

  const user2Interests = await this.findAll({
    where: { 
      user_id: user2Id,
      preference: ['love', 'like']
    },
    include: [{
      model: sequelize.models.Interest,
      as: 'Interest',
      where: { is_active: true }
    }]
  });

  // Находим пересечения
  const common = [];
  user1Interests.forEach(u1Interest => {
    const match = user2Interests.find(u2Interest => 
      u2Interest.interest_id === u1Interest.interest_id
    );
    if (match) {
      common.push({
        interest: u1Interest.Interest,
        user1_preference: u1Interest.preference,
        user1_intensity: u1Interest.intensity,
        user2_preference: match.preference,
        user2_intensity: match.intensity,
        compatibility_score: Math.min(u1Interest.intensity, match.intensity)
      });
    }
  });

  return common.sort((a, b) => b.compatibility_score - a.compatibility_score);
};

UserInterest.updateActivity = async function(userId, interestId) {
  return await this.update(
    { last_activity: new Date() },
    { 
      where: { 
        user_id: userId, 
        interest_id: interestId 
      } 
    }
  );
};

module.exports = UserInterest;
