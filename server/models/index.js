const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const EventTemplate = require('./EventTemplate');
const Media = require('./Media');
const Pair = require('./Pair');
const GameRoom = require('./GameRoom');
const Gift = require('./Gift');

const models = {
  User,
  Event,
  EventTemplate,
  Media,
  Pair,
  GameRoom,
  Gift,
};

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;

module.exports = models;