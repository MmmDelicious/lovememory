const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  locale: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'ru',
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null for Google users initially
    validate: {
      isIn: [['male', 'female', 'other']],
    },
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for Google users initially
    validate: {
      min: 18,
      max: 99,
    },
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null for Google users initially
    validate: {
      len: [1, 100],
    },
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'premium'),
    allowNull: false,
    defaultValue: 'user',
  },
  telegram_chat_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  coins: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: () => Math.floor(Math.random() * 500) + 1000 // 1000-1500 монет
  },
  last_active: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  streak_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  total_login_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  preferences: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'users'
});
User.beforeCreate(async (user) => {
  if (user.password_hash && user.password_hash.length < 60) { // Only hash if it's not already hashed
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});
User.prototype.validPassword = async function(password) {
  if (!this.password_hash) {
    return false;
  }
  return await bcrypt.compare(password, this.password_hash);
};
User.associate = (models) => {
  User.hasMany(models.Event, { foreignKey: 'userId', onDelete: 'CASCADE' });
  User.hasMany(models.GameRoom, { foreignKey: 'host_id', as: 'HostedRooms' });
  User.hasMany(models.Pair, {
    foreignKey: 'user1_id',
    as: 'SentPairRequests',
    onDelete: 'CASCADE',
  });
  User.hasMany(models.Pair, {
    foreignKey: 'user2_id',
    as: 'ReceivedPairRequests',
    onDelete: 'CASCADE',
  });
  // Новая ассоциация many-to-many через UserPair
  User.hasMany(models.UserPair, {
    foreignKey: 'user_id',
    as: 'UserPairs',
    onDelete: 'CASCADE',
  });
  // Ассоциация с участием в играх
  User.hasMany(models.GameParticipant, {
    foreignKey: 'user_id',
    as: 'GameParticipations',
    onDelete: 'CASCADE',
  });
  // Ассоциация с согласиями
  User.hasOne(models.Consent, {
    foreignKey: 'user_id',
    as: 'Consent',
    onDelete: 'CASCADE',
  });
  // Ассоциация с токенами уведомлений
  User.hasMany(models.NotificationToken, {
    foreignKey: 'user_id',
    as: 'NotificationTokens',
    onDelete: 'CASCADE',
  });
  // Ассоциация с транзакциями
  User.hasMany(models.Transaction, {
    foreignKey: 'user_id',
    as: 'Transactions',
    onDelete: 'SET NULL',
  });
  // Ассоциация с завершенными уроками (новая структура)
  User.hasMany(models.UserLessonProgress, {
    foreignKey: 'completed_by_user_id',
    as: 'CompletedLessons',
    onDelete: 'CASCADE',
  });
  // Ассоциация с достижениями
  User.hasMany(models.Achievement, {
    foreignKey: 'user_id',
    as: 'Achievements',
    onDelete: 'SET NULL',
  });
  // Ассоциация с турнирами (как создатель)
  User.hasMany(models.Tournament, {
    foreignKey: 'creator_id',
    as: 'CreatedTournaments',
    onDelete: 'SET NULL',
  });
  // Ассоциация с сессиями (как создатель)
  User.hasMany(models.Session, {
    foreignKey: 'created_by_user_id',
    as: 'CreatedSessions',
    onDelete: 'SET NULL',
  });
  
  // Новые ассоциации для AI-фундамента
  // Ассоциация с интересами пользователя
  User.hasMany(models.UserInterest, {
    foreignKey: 'user_id',
    as: 'UserInterests',
    onDelete: 'CASCADE',
  });
  
  // Ассоциация с обратной связью по рекомендациям
  User.hasMany(models.RecommendationFeedback, {
    foreignKey: 'user_id',
    as: 'RecommendationFeedbacks',
    onDelete: 'CASCADE',
  });
};
module.exports = User;
