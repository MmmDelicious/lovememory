const rateLimit = require('express-rate-limit');
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // maximum 1000 requests per window
  message: {
    error: 'Rate limit exceeded. Try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // maximum 5 authentication attempts per window
  message: {
    error: 'Login attempt limit exceeded. Try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // don't count successful requests
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // maximum 10 uploads per hour
  message: {
    error: 'File upload limit exceeded. Try again in an hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // maximum 50 AI requests per hour
  message: {
    error: 'AI request limit exceeded. Try again in an hour.',
    retryAfter: '1 hour'
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

