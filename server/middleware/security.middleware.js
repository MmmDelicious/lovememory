const helmet = require('helmet');

// Конфигурация безопасности заголовков
const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Для CSS-in-JS
        "fonts.googleapis.com"
      ],
      scriptSrc: [
        "'self'",
        // Только в development режиме разрешаем unsafe-eval для hot reload
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
        "*.unsplash.com", // Для изображений из Unsplash
        "*.githubusercontent.com" // Для аватаров GitHub
      ],
      connectSrc: [
        "'self'",
        process.env.AI_GATEWAY_URL || '', // AI Gateway
        "wss:", // WebSocket соединения
        "ws:" // WebSocket соединения (dev)
      ],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    },
  },
  
  // Отключаем X-Powered-By заголовок
  hidePoweredBy: true,
  
  // Предотвращаем clickjacking
  frameguard: { action: 'deny' },
  
  // HSTS в production
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 год
    includeSubDomains: true,
    preload: true
  } : false,
  
  // Предотвращаем MIME sniffing
  noSniff: true,
  
  // Блокируем загрузку в iframe
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'same-origin' }
});

// Дополнительные заголовки безопасности
const additionalSecurityHeaders = (req, res, next) => {
  // Запрещаем кэширование чувствительных данных
  if (req.path.includes('/api/auth') || req.path.includes('/api/user')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  
  // Заголовки для API
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  
  // Permissions Policy (Feature Policy)
  res.set('Permissions-Policy', [
    'camera=(),',
    'microphone=(),',
    'geolocation=(self),',
    'interest-cohort=()'
  ].join(' '));
  
  next();
};

// Middleware для проверки Origin заголовка
const validateOrigin = (req, res, next) => {
  const origin = req.get('Origin');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  
  // Пропускаем запросы без Origin (например, Postman)
  if (!origin) {
    return next();
  }
  
  // В development разрешаем localhost
  if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
    return next();
  }
  
  // Проверяем белый список
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
