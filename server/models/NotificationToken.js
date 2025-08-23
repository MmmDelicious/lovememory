const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationToken = sequelize.define('NotificationToken', {
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
  provider: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['firebase', 'apns', 'web_push', 'expo', 'telegram']],
    },
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'notification_tokens',
  indexes: [
    {
      fields: ['user_id'],
      name: 'idx_notification_tokens_user'
    },
    {
      fields: ['provider'],
      name: 'idx_notification_tokens_provider'
    },
    {
      fields: ['enabled'],
      name: 'idx_notification_tokens_enabled'
    },
    {
      fields: ['user_id', 'provider'],
      name: 'idx_notification_tokens_user_provider'
    }
  ]
});

NotificationToken.associate = (models) => {
  NotificationToken.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User',
    onDelete: 'CASCADE'
  });
};

// Статические методы для работы с токенами
NotificationToken.addToken = async function(userId, provider, token) {
  // Находим или создаем токен
  const [tokenRecord, created] = await this.findOrCreate({
    where: { user_id: userId, provider },
    defaults: { token, enabled: true }
  });

  // Если токен изменился, обновляем его
  if (!created && tokenRecord.token !== token) {
    await tokenRecord.update({ token, enabled: true });
  }

  return tokenRecord;
};

NotificationToken.removeToken = async function(userId, provider) {
  return await this.destroy({
    where: { user_id: userId, provider }
  });
};

NotificationToken.disableToken = async function(userId, provider) {
  return await this.update(
    { enabled: false },
    { where: { user_id: userId, provider } }
  );
};

NotificationToken.getActiveTokens = async function(userId, provider = null) {
  const where = { user_id: userId, enabled: true };
  if (provider) {
    where.provider = provider;
  }

  return await this.findAll({ where });
};

// Получение всех активных токенов для отправки массовых уведомлений
NotificationToken.getAllActiveByProvider = async function(provider) {
  return await this.findAll({
    where: { provider, enabled: true },
    include: [{ model: this.sequelize.models.User, as: 'User' }]
  });
};

module.exports = NotificationToken;
