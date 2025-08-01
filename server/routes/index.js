const { Router } = require('express');
const authRoutes = require('./auth.routes');
const eventRoutes = require('./event.routes');
const mediaRoutes = require('./media.routes');
const pairRoutes = require('./pair.routes');
const userRoutes = require('./user.routes');
const gameRoutes = require('./game.routes');
const aiRoutes = require('./ai.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/media', mediaRoutes);
router.use('/pair', pairRoutes);
router.use('/user', userRoutes);
router.use('/games', gameRoutes);
router.use('/ai', aiRoutes);

module.exports = router;