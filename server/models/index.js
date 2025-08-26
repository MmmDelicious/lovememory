const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const EventTemplate = require('./EventTemplate');
const Media = require('./Media');
const Pair = require('./Pair');
const UserPair = require('./UserPair');
const GameRoom = require('./GameRoom');
const GameParticipant = require('./GameParticipant');
const Gift = require('./Gift');
const ShopItem = require('./ShopItem');
const Transaction = require('./Transaction');
const Consent = require('./Consent');
const Insight = require('./Insight');
const NotificationToken = require('./NotificationToken');
const Achievement = require('./Achievement');
const Tournament = require('./Tournament');
const TournamentMatch = require('./TournamentMatch');
const MediaDerivative = require('./MediaDerivative');
const Session = require('./Session');
const RelationshipMetrics = require('./RelationshipMetrics');
const Lesson = require('./Lesson');
const UserLessonProgress = require('./UserLessonProgress');
const PairDailyLesson = require('./PairDailyLesson');
const ActivityLog = require('./ActivityLog');

// TypeScript модели пока отключены - будут подключены после компиляции
let RelationshipProfile = null;
console.log('📝 RelationshipProfile (TS model) temporarily disabled - will be enabled after TS compilation');
const models = {
  User,
  Event,
  EventTemplate,
  Media,
  Pair,
  UserPair,
  GameRoom,
  GameParticipant,
  Gift,
  ShopItem,
  Transaction,
  Consent,
  Insight,
  NotificationToken,
  Achievement,
  Tournament,
  TournamentMatch,
  MediaDerivative,
  Session,
  RelationshipMetrics,
  Lesson,
  UserLessonProgress,
  PairDailyLesson,
  ActivityLog,
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
