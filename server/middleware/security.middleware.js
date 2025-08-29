const helmet = require('helmet');
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // For CSS-in-JS
        "fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : [])
      ],
      fontSrc: [
        "'self'",
        "fonts.gstatic.com",
        "data:"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "*.unsplash.com", // For images from Unsplash
        "*.githubusercontent.com" // For GitHub avatars
      ],
      connectSrc: [
        "'self'",
        process.env.AI_GATEWAY_URL || '', // AI Gateway
        "wss:", // WebSocket connections
        "ws:" // WebSocket connections (dev)
      ],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    },
  },
  hidePoweredBy: true,
  frameguard: { action: 'deny' },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
});
const additionalSecurityHeaders = (req, res, next) => {
  if (req.path.includes('/api/auth') || req.path.includes('/api/user')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Permissions-Policy', [
    'camera=(),',
    'microphone=(),',
    'geolocation=(self),',
    'interest-cohort=()'
  ].join(' '));
  next();
};
const validateOrigin = (req, res, next) => {
  const origin = req.get('Origin');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  if (!origin) {
    return next();
  }
  if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
    return next();
  }
  if (allowedOrigins.includes(origin)) {
    return next();
  }
  console.warn(`Blocked request from suspicious origin: ${origin}`);
  return res.status(403).json({
    status: 'error',
    message: 'Forbidden: Invalid origin'
  });
};
module.exports = {
  securityHeaders,
  additionalSecurityHeaders,
  validateOrigin
};

