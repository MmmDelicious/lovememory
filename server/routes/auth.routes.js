const { Router } = require('express');
const passport = require('passport');
const { register, login, logout, googleCallback, getMe } = require('../controllers/auth.controller');
const { authLimiter, basicLimiter } = require('../middleware/rateLimit.middleware');
const { authenticateToken } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const validationMiddleware = require('../middleware/validation.middleware');

const router = Router();

// Валидация для регистрации
const registerValidation = [
  body('email').isEmail().withMessage('Некорректный email'),
  body('password').isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов'),
  body('first_name').trim().isLength({ min: 1, max: 50 }).withMessage('Имя обязательно (1-50 символов)'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Некорректный пол'),
  body('city').trim().isLength({ min: 1, max: 100 }).withMessage('Город обязателен (1-100 символов)'),
  body('age').isInt({ min: 18, max: 99 }).withMessage('Возраст должен быть от 18 до 99 лет'),
];

// Валидация для логина (убрали normalizeEmail чтобы email оставался как есть)
const loginValidation = [
  body('email').isEmail().withMessage('Некорректный email'),
  body('password').notEmpty().withMessage('Пароль обязателен'),
];

router.post('/register', authLimiter, registerValidation, validationMiddleware.handleValidationErrors, register);
router.post('/login', authLimiter, loginValidation, validationMiddleware.handleValidationErrors, login);
router.post('/logout', basicLimiter, logout);
router.get('/me', authenticateToken, getMe);

// Endpoint для обновления токена (пока заглушка)
router.post('/refresh', basicLimiter, (req, res) => {
  res.status(501).json({ message: 'Refresh token not implemented yet' });
});

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