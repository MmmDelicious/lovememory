const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Consent = sequelize.define('Consent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  analytics_opt_in: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  ai_opt_in: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  share_messages_for_analysis: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  consented_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'consents',
  indexes: [
    {
      unique: true,
      fields: ['user_id'],
      name: 'unique_consent_user'
    }
  ]
});

Consent.associate = (models) => {
  Consent.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'User',
    onDelete: 'CASCADE'
  });
};

// Статические методы для работы с согласиями
Consent.giveConsent = async function(userId, consentData) {
  const { analytics_opt_in, ai_opt_in, share_messages_for_analysis } = consentData;
  
  return await this.upsert({
    user_id: userId,
    analytics_opt_in: !!analytics_opt_in,
    ai_opt_in: !!ai_opt_in,
    share_messages_for_analysis: !!share_messages_for_analysis,
    consented_at: new Date()
  });
};

Consent.hasConsent = async function(userId, consentType) {
  const consent = await this.findOne({ where: { user_id: userId } });
  
  if (!consent) return false;
  
  switch (consentType) {
    case 'analytics':
      return consent.analytics_opt_in;
    case 'ai':
      return consent.ai_opt_in;
    case 'messages':
      return consent.share_messages_for_analysis;
    default:
      return false;
  }
};

module.exports = Consent;
