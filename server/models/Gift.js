const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Gift = sequelize.define('Gift', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fromUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  toUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  giftType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['guitar', 'running-character']]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  photoPath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isViewed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  viewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'gifts',
  timestamps: true,
  indexes: [
    {
      fields: ['fromUserId']
    },
    {
      fields: ['toUserId']
    },
    {
      fields: ['isDelivered']
    },
    {
      fields: ['isViewed']
    }
  ]
});
Gift.associate = (models) => {
  Gift.belongsTo(models.User, {
    foreignKey: 'fromUserId',
    as: 'sender'
  });
  Gift.belongsTo(models.User, {
    foreignKey: 'toUserId',
    as: 'recipient'
  });
};
module.exports = Gift;

