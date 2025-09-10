const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const EventTemplate = require('./EventTemplate');
const Media = require('./Media');
const Pair = require('./Pair');
const UserPair = require('./UserPair');
const GameRoom = require('./GameRoom');
const GameParticipant = require('./GameParticipant');
const NotificationToken = require('./NotificationToken');
const Achievement = require('./Achievement');
const Tournament = require('./Tournament');
const TournamentMatch = require('./TournamentMatch');
const MediaDerivative = require('./MediaDerivative');
const Session = require('./Session');
const Lesson = require('./Lesson');
const UserLessonProgress = require('./UserLessonProgress');
const PairDailyLesson = require('./PairDailyLesson');
const ActivityLog = require('./ActivityLog');
const ActivityTracker = require('./ActivityTracker');
const Interest = require('./Interest');
const UserInterest = require('./UserInterest');

let RelationshipProfile = null;
const models = {
  User,
  Event,
  EventTemplate,
  Media,
  Pair,
  UserPair,
  GameRoom,
  GameParticipant,
  NotificationToken,
  Achievement,
  Tournament,
  TournamentMatch,
  MediaDerivative,
  Session,
  Lesson,
  UserLessonProgress,
  PairDailyLesson,
  ActivityLog,
  ActivityTracker,
  Interest,
  UserInterest,
};

// Добавляем TS модели если они загрузились (пока отключено)
// if (RelationshipProfile) {
//   models.RelationshipProfile = RelationshipProfile;
// }
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});
models.sequelize = sequelize;
module.exports = models;
