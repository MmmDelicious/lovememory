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
require('./config/passport');

const app = express();
const server = http.createServer(app);

const io = initSocket(server, app);

// Build CORS allow-list. Supports comma-separated ALLOWED_ORIGINS.
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
    // Allow non-browser or same-origin requests
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, allow localhost origins automatically
    if (process.env.NODE_ENV !== 'production' && /^(http:\/\/|https:\/\/)localhost:\d+/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Created uploads directory.');
}
app.use('/uploads', express.static(uploadsDir));

app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.send('LoveMemory API is running!');
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
    
    await gameService.cleanupOrphanedRooms(io);

    server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    
    startBot();
    startCronJobs();
  } catch (error) {
    console.error('Unable to start the server:', error);
  }
};

startServer();