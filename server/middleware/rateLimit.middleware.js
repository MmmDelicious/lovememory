const rateLimit = require('express-rate-limit');
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 1000 запросов за окно
  message: {
    error: 'Превышен лимит запросов. Попробуйте позже.',
    retryAfter: '15 минут'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток аутентификации за окно
  message: {
    error: 'Превышен лимит попыток входа. Попробуйте через 15 минут.',
    retryAfter: '15 минут'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // не считаем успешные запросы
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // максимум 10 загрузок за час
  message: {
    error: 'Превышен лимит загрузки файлов. Попробуйте через час.',
    retryAfter: '1 час'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 50, // максимум 50 AI запросов за час
  message: {
    error: 'Превышен лимит AI запросов. Попробуйте через час.',
    retryAfter: '1 час'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
module.exports = {
  basicLimiter,
  authLimiter,
  uploadLimiter,
  aiLimiter
};

