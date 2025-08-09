const { Router } = require('express');
const passport = require('passport');
const { register, login, logout, googleCallback } = require('../controllers/auth.controller');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google-auth-failed`,
    session: false,
  }),
  googleCallback
);

module.exports = router;