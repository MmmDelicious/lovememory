const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Media = sequelize.define('Media', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  eventId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Events',
      key: 'id',
    },
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_type: {
    type: DataTypes.ENUM('image', 'video'),
    defaultValue: 'image',
  },
});

module.exports = Media;