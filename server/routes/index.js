const { Router } = require('express');
const authRoutes = require('./auth.routes');
const eventRoutes = require('./event.routes');
const eventTemplateRoutes = require('./eventTemplate.routes');
const mediaRoutes = require('./media.routes');
const mediaDerivativeRoutes = require('./mediaDerivative.routes');
const pairRoutes = require('./pair.routes');
const userRoutes = require('./user.routes');
const gameRoutes = require('./game.routes');
const tournamentRoutes = require('./tournament.routes');
const sessionRoutes = require('./session.routes');
const aiRoutes = require('./ai.routes');
const intelligenceRoutes = require('./intelligence.routes');
const lessonRoutes = require('./lesson.routes');
const activityTrackerRoutes = require('./activityTracker.routes');
const interestRoutes = require('./interest.routes');
const feedbackRoutes = require('./feedback.routes');
const recommendationRoutes = require('./recommendation.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/event-templates', eventTemplateRoutes);
router.use('/media', mediaRoutes);
router.use('/media', mediaDerivativeRoutes); // MediaDerivative routes under /media prefix
router.use('/pair', pairRoutes);
router.use('/user', userRoutes);
router.use('/games', gameRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/sessions', sessionRoutes);
router.use('/ai', aiRoutes);
router.use('/intelligence', intelligenceRoutes);
router.use('/lessons', lessonRoutes);
router.use('/activity-tracker', activityTrackerRoutes);
router.use('/interests', interestRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/recommendations', recommendationRoutes);

module.exports = router;