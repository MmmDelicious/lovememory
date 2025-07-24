const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
    allowNull: false,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true,
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
  const salt = await bcrypt.genSalt(10);
  user.password_hash = await bcrypt.hash(user.password_hash, salt);
});

User.prototype.validPassword = async function(password) {
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