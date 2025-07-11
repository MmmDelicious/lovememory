const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const Media = require('./Media');
const Pair = require('./Pair');
const GameRoom = require('./GameRoom');

const models = {
  User,
  Event,
  Media,
  Pair,
  GameRoom,
};

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;

module.exports = models;