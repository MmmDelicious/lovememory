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
    type: DataTypes.ENUM('user', 'admin'),
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
    defaultValue: 1000
  }
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
  User.hasMany(models.GameRoom, { foreignKey: 'hostId', as: 'HostedRooms' });

  User.hasMany(models.Pair, {
    foreignKey: 'user1Id',
    as: 'SentPairRequests',
    onDelete: 'CASCADE',
  });
  User.hasMany(models.Pair, {
    foreignKey: 'user2Id',
    as: 'ReceivedPairRequests',
    onDelete: 'CASCADE',
  });
};

module.exports = User;