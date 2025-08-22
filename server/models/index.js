const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const EventTemplate = require('./EventTemplate');
const Media = require('./Media');
const Pair = require('./Pair');
const GameRoom = require('./GameRoom');
const Gift = require('./Gift');
const RelationshipMetrics = require('./RelationshipMetrics');
const Lesson = require('./Lesson');
const UserLessonProgress = require('./UserLessonProgress');
const PairDailyLesson = require('./PairDailyLesson');
const models = {
  User,
  Event,
  EventTemplate,
  Media,
  Pair,
  GameRoom,
  Gift,
  RelationshipMetrics,
  Lesson,
  UserLessonProgress,
  PairDailyLesson,
};
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});
models.sequelize = sequelize;
module.exports = models;
