const { Router } = require('express');
const { getProfile, updateProfile, getProfileStats, uploadAvatar } = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = Router();
router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/stats', getProfileStats);
router.post('/avatar', upload.single('avatar'), uploadAvatar);

module.exports = router;