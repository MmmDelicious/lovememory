require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const fs = require('fs');
const http = require('http');

const sequelize = require('./config/database');
const gameService = require('./services/game.service');
const { startBot, startCronJobs } = require('./services/telegram.service');
const { initSocket } = require('./socket');
const errorHandler = require('./middleware/errorHandler.middleware');
const apiRouter = require('./routes');
const { checkRedisHealth } = require('./config/redis');
const { initClickHouse } = require('./config/clickhouse');
require('./config/passport');

const app = express();
const server = http.createServer(app);

const io = initSocket(server, app);

global.io = io;
const defaultOrigin = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
if (!allowedOrigins.includes(defaultOrigin)) {
  allowedOrigins.push(defaultOrigin);
}

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && /^(http:\/\/|https:\/\/)localhost:\d+/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// API routes

app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.send('LoveMemory API is running!');
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    // Временно отключаем синхронизацию моделей
    // await sequelize.sync({ alter: false });
    
    // Инициализируем ClickHouse
    try {
      await initClickHouse();
      console.log('✅ ClickHouse initialized successfully');
    } catch (clickhouseError) {
      console.error('⚠️ ClickHouse initialization failed:', clickhouseError);
      console.log('🔄 Server will continue without ClickHouse analytics');
    }
    
    // Автозаполнение базы данных начальными данными
    if (process.env.NODE_ENV === 'production') {
      try {
        // Заполняем интересы
        const { Interest } = require('./models');
        const interestCount = await Interest.count();
        if (interestCount === 0) {
          console.log('Заполняем базу начальными данными...');
          const seedInterests = require('./seeders/interests-seed');
          // Функция seeding будет добавлена
        }
      } catch (error) {
        console.log('Ошибка при заполнении данными:', error.message);
      }
    }

    await gameService.cleanupOrphanedRooms(io);
    try {
      const redisHealthy = await checkRedisHealth();
      if (redisHealthy) {

      } else {

      }
    } catch (error) {

    }

    server.listen(PORT, () => {});
    
    startBot();
    startCronJobs();
  } catch (error) {
    console.error('Unable to start the server:', error);
  }
};

startServer();