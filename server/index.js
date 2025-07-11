require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');

const sequelize = require('./config/database');
const { GameRoom } = require('./models');
const { startBot, startCronJobs } = require('./services/telegram.service');
const gameController = require('./controllers/game.controller');
const GameManager = require('./gameLogic/GameManager');

const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const pairRoutes = require('./routes/pair.routes');
const userRoutes = require('./routes/user.routes');
const gameRoutes = require('./routes/game.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL || "http://localhost:5173",
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Created uploads directory.');
}
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/pair', pairRoutes);
app.use('/api/user', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('LoveMemory API is running!');
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token.'));
    }
    socket.user = { id: decoded.userId, email: decoded.email };
    socket.join(socket.user.id);
    next();
  });
});

io.on('connection', (socket) => {
  const userRooms = new Set();

  socket.on('join_room', async (roomId) => {
    try {
      const room = await GameRoom.findByPk(roomId);
      if (!room || (room.status !== 'waiting' && room.status !== 'in_progress')) {
        socket.emit('error', 'Комната не найдена или игра уже завершена.');
        return;
      }
      if (!room.players.includes(socket.user.id)) {
        await room.update({
          players: sequelize.fn('array_append', sequelize.col('players'), socket.user.id)
        });
        await room.reload();
      }
      
      await socket.join(roomId);
      userRooms.add(roomId);
      
      const allSocketsInRoom = await io.in(roomId).fetchSockets();
      const playerInfo = allSocketsInRoom.map(s => ({ id: s.user.id, email: s.user.email }));
      io.to(roomId).emit('player_list_update', playerInfo);

      if (room.players.length === 2 && room.status === 'waiting') {
        await gameController.startGame(roomId);
        const playerIds = room.players; 
        const game = GameManager.createGame(roomId, room.gameType, playerIds);
        io.to(roomId).emit('game_start', game.getState());
      }
    } catch (error) {
        console.error(`[join_room] Error for user ${socket.user.id} in room ${roomId}:`, error);
        socket.emit('error', 'Произошла ошибка при подключении к комнате.');
    }
  });

  socket.on('make_move', (data) => {
    const { roomId, move } = data;
    const game = GameManager.getGame(roomId);
    if (!game) return;

    try {
      const newState = game.makeMove(socket.user.id, move);
      
      if (newState.status === 'finished') {
        io.to(roomId).emit('game_end', newState);
        
        if (newState.winner && newState.winner !== 'draw') {
          const winnerId = newState.winner;
          const loserId = newState.players.find(id => id !== winnerId);
          gameController.finalizeGame(roomId, winnerId, loserId).then(res => {
            if (res) {
              if (res.winner) io.to(res.winner.id).emit('update_coins', res.winner.coins);
              if (res.loser) io.to(res.loser.id).emit('update_coins', res.loser.coins);
            }
          });
        }
        GameManager.removeGame(roomId);
      } else {
        io.to(roomId).emit('game_update', newState);
      }
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  const handleLeaveOrDisconnect = async () => {
    for (const roomId of userRooms) {
      const game = GameManager.getGame(roomId);
      
      if (game && game.getState().status === 'in_progress') {
        const remainingPlayerId = game.players.find(id => id !== socket.user.id);
        
        if (remainingPlayerId) {
          const finalState = {
            ...game.getState(),
            status: 'finished',
            winner: remainingPlayerId,
            isDraw: false,
          };
          io.to(roomId).emit('game_end', finalState);

          gameController.finalizeGame(roomId, remainingPlayerId, socket.user.id).then(res => {
             if (res && res.winner) {
                io.to(res.winner.id).emit('update_coins', res.winner.coins);
             }
          });
        }
        GameManager.removeGame(roomId);
      } else {
        const room = await GameRoom.findByPk(roomId);
        if (room && room.status === 'waiting') {
            await room.update({
                players: sequelize.fn('array_remove', sequelize.col('players'), socket.user.id)
            });
            const remainingSockets = await io.in(roomId).fetchSockets();
            const players = remainingSockets.map(s => ({ id: s.user.id, email: s.user.email }));
            io.to(roomId).emit('player_list_update', players);
        }
      }
      userRooms.delete(roomId);
    }
  };

  socket.on('leave_room', handleLeaveOrDisconnect);
  socket.on('disconnect', handleLeaveOrDisconnect);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    await sequelize.sync();
    console.log('All models were synchronized successfully.');

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    startBot();
    startCronJobs();

  } catch (error) {
    console.error('Unable to start the server:', error);
  }
};

startServer();