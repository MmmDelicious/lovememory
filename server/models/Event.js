const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  event_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  event_type: {
    type: DataTypes.ENUM('memory', 'plan', 'anniversary'),
    defaultValue: 'plan',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  }
});

Event.associate = (models) => {
  Event.belongsTo(models.User, { foreignKey: 'userId' });
  Event.hasMany(models.Media, { foreignKey: 'eventId', onDelete: 'CASCADE' });
};

module.exports = Event;