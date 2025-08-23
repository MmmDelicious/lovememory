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
  pair_id: {
    type: DataTypes.UUID,
    allowNull: true, // Nullable для обратной совместимости
    references: {
      model: 'Pairs',
      key: 'id',
    },
  },
});
Media.associate = (models) => {
  Media.belongsTo(models.Event, { foreignKey: 'eventId' });
  Media.belongsTo(models.Pair, { 
    foreignKey: 'pair_id', 
    as: 'Pair',
    onDelete: 'SET NULL'
  });
  Media.hasMany(models.MediaDerivative, {
    foreignKey: 'source_media_id',
    as: 'Derivatives',
    onDelete: 'CASCADE'
  });
};
module.exports = Media;
