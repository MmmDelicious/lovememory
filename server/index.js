// server/index.js
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
  console.log('[SERVER] New socket connection attempt.');
  const token = socket.handshake.auth.token;
  if (!token) {
    console.error('[SERVER] [ERROR] Auth error: No token provided.');
    return next(new Error('Authentication error: No token provided.'));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('[SERVER] [ERROR] Auth error: Invalid token.');
      return next(new Error('Authentication error: Invalid token.'));
    }
    socket.user = { id: decoded.userId, email: decoded.email };
    console.log(`[SERVER] Auth successful for user: ${socket.user.id}`);
    socket.join(socket.user.id);
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`[SERVER] User connected: ${socket.user.id} with socket ID ${socket.id}`);
  const userRooms = new Set();

  socket.on('join_room', async (roomId) => {
    console.log(`[SERVER] User ${socket.user.id} trying to join room ${roomId}`);
    try {
      const room = await GameRoom.findByPk(roomId);
      if (!room || (room.status !== 'waiting' && room.status !== 'in_progress')) {
        console.error(`[SERVER] [ERROR] Room ${roomId} not found or game is over.`);
        socket.emit('error', 'Комната не найдена или игра уже завершена.');
        return;
      }
      
      let playersInRoom = room.players || [];
      console.log(`[SERVER] Current players in room before join:`, playersInRoom);
      if (!playersInRoom.includes(socket.user.id)) {
        if (socket.user.id === room.hostId) {
          // hostId всегда первый
          if (playersInRoom[0] !== room.hostId) {
            playersInRoom = [room.hostId, ...playersInRoom.filter(id => id !== room.hostId)];
            console.log(`[SERVER] HostId reordered to first:`, playersInRoom);
          }
        } else {
          // Второй игрок добавляется только если его нет и он не hostId
          if (!playersInRoom.includes(socket.user.id)) {
            playersInRoom = [playersInRoom[0], socket.user.id].filter(Boolean);
            console.log(`[SERVER] Added second player:`, playersInRoom);
          }
        }
        await room.update({ players: playersInRoom });
        await room.reload();
        console.log(`[SERVER] Players in room after join:`, room.players);
      } else {
        console.log(`[SERVER] User ${socket.user.id} is already in room ${roomId}`);
      }
      
      await socket.join(roomId);
      userRooms.add(roomId);
      console.log(`[SERVER] User ${socket.user.id} successfully joined socket room ${roomId}`);
      
      const allSocketsInRoom = await io.in(roomId).fetchSockets();
      const playerInfo = allSocketsInRoom.map(s => ({ id: s.user.id, name: s.user.email.split('@')[0] })); // Use part of email as name
      console.log(`[SERVER] Emitting 'player_list_update' to room ${roomId} with players:`, playerInfo.map(p => p.id));
      io.to(roomId).emit('player_list_update', playerInfo);

      const updatedRoom = await room.reload();
      console.log(`[SERVER] Room players before game start:`, updatedRoom.players);
      if (updatedRoom.players.length === 2 && updatedRoom.status === 'waiting') {
        console.log(`[SERVER] Two players in room ${roomId}. Starting game...`);
        await gameController.startGame(roomId);
        const gameType = updatedRoom.gameType;
        console.log(`[SERVER] Starting game (${gameType}) with players:`, playerInfo);
        const game = GameManager.createGame(roomId, gameType, playerInfo);

        io.to(roomId).emit('game_start', { gameType, players: playerInfo });

        if (gameType === 'poker') {
            playerInfo.forEach(player => {
                const stateForPlayer = game.getStateForPlayer(player.id);
                io.to(player.id).emit('game_update', stateForPlayer);
            });
        } else {
            const initialState = game.getState();
            io.to(roomId).emit('game_update', initialState);
        }
      }
    } catch (error) {
        console.error(`[SERVER] [ERROR] in 'join_room' for user ${socket.user.id} in room ${roomId}:`, error);
        socket.emit('error', 'Произошла ошибка при подключении к комнате.');
    }
  });

  socket.on('get_game_state', async (roomId) => {
    const game = GameManager.getGame(roomId);
    if (game) {
      if (game.gameType === 'poker') {
        const stateForPlayer = game.getStateForPlayer(socket.user.id);
        console.log(`[SERVER] Sending poker game state for room ${roomId} to user ${socket.user.id}`);
        socket.emit('game_update', stateForPlayer);
      } else {
        const state = game.getState();
        console.log(`[SERVER] Sending game state for room ${roomId} to user ${socket.user.id}`);
        socket.emit('game_update', state);
      }
    } else {
      // Проверяем есть ли комната в ожидании
      try {
        const room = await GameRoom.findByPk(roomId);
        if (room && room.status === 'waiting') {
          console.log(`[SERVER] Room ${roomId} is waiting for players. Sending waiting state.`);
          socket.emit('game_update', {
            gameType: room.gameType,
            status: 'waiting',
            players: [],
            stage: 'waiting',
            message: 'Ожидание второго игрока...'
          });
        } else {
          console.log(`[SERVER] No game found for room ${roomId} on get_game_state request.`);
        }
      } catch (error) {
        console.error(`[SERVER] Error checking room status:`, error);
      }
    }
  });

  socket.on('make_move', (data) => {
    const { roomId, move } = data;
    console.log(`[SERVER] Received 'make_move' from ${socket.user.id} in room ${roomId} with move:`, move);
    const game = GameManager.getGame(roomId);
    if (!game) {
        console.error(`[SERVER] [ERROR] Game not found for room ${roomId}`);
        return;
    }
    
    try {
      const gameType = game.gameType;
      
      game.makeMove(socket.user.id, move);

      if (gameType === 'poker') {
        game.players.forEach(player => { // Correctly iterate over player objects
            const stateForPlayer = game.getStateForPlayer(player.id);
            io.to(player.id).emit('game_update', stateForPlayer);
        });
      } else {
        const newState = game.getState();
        io.to(roomId).emit('game_update', newState);
      }
      
      if (game.status === 'finished') {
        console.log(`[SERVER] Game in room ${roomId} finished. Emitting 'game_end'.`);
        
        if (gameType === 'poker') {
          // Для покера отправляем состояние каждому игроку
          game.players.forEach(player => {
            const stateForPlayer = game.getStateForPlayer(player.id);
            io.to(player.id).emit('game_end', stateForPlayer);
          });
          
          // Обрабатываем завершение покерной раздачи
          const gameState = game.getState();
          if (gameState.winner && gameState.winner !== 'draw') {
            const winnerId = typeof gameState.winner === 'object' ? gameState.winner.id : gameState.winner;
            const loserId = game.players.find(p => p.id !== winnerId).id;
            console.log(`[SERVER] Finalizing poker game. Winner: ${winnerId}, Loser: ${loserId}`);
            gameController.finalizeGame(roomId, winnerId, loserId).then(res => {
              if (res) {
                if (res.winner) io.to(res.winner.id).emit('update_coins', res.winner.coins);
                if (res.loser) io.to(res.loser.id).emit('update_coins', res.loser.coins);
              }
            });
          }
          
          // После завершения раздачи, запускаем новую через 3 секунды если игроки остались
          setTimeout(() => {
            const currentGame = GameManager.getGame(roomId);
            if (currentGame && currentGame.players.every(p => p.stack > 0)) {
              console.log(`[SERVER] Starting new poker hand in room ${roomId}`);
              currentGame.startNewHand();
              // Отправляем обновления всем игрокам
              currentGame.players.forEach(player => {
                const stateForPlayer = currentGame.getStateForPlayer(player.id);
                io.to(player.id).emit('game_update', stateForPlayer);
              });
            } else {
              // Игра окончательно завершена
              GameManager.removeGame(roomId);
            }
          }, 3000);
        } else {
          // Для других игр
          const finalState = game.getState();
          io.to(roomId).emit('game_end', finalState);
          
          if (game.winner && game.winner !== 'draw') {
            const winnerId = game.winner;
            const loserId = game.players.find(p => p !== winnerId);
            console.log(`[SERVER] Finalizing game. Winner: ${winnerId}, Loser: ${loserId}`);
            gameController.finalizeGame(roomId, winnerId, loserId).then(res => {
              if (res) {
                if (res.winner) io.to(res.winner.id).emit('update_coins', res.winner.coins);
                if (res.loser) io.to(res.loser.id).emit('update_coins', res.loser.coins);
              }
            });
          }
          GameManager.removeGame(roomId);
        }
      }
    } catch (error) {
      console.error(`[SERVER] [ERROR] in 'make_move':`, error.message);
      socket.emit('error', error.message);
    }
  });

  const handleLeaveOrDisconnect = async () => {
    console.log(`[SERVER] User ${socket.user.id} is leaving or disconnecting.`);
    for (const roomId of userRooms) {
      console.log(`[SERVER] Handling disconnect for room ${roomId}`);
      const game = GameManager.getGame(roomId);
      
      if (game && game.players && game.getState().status !== 'finished') {
        const remainingPlayer = game.players.find(p => p.id !== socket.user.id);
        console.log(`[SERVER] Game in progress. Player ${socket.user.id} disconnected. Remaining player: ${remainingPlayer ? remainingPlayer.id : 'none'}`);
        if (remainingPlayer) {
          if (game.gameType === 'poker') {
            // Для покера - остающийся игрок получает все блайнды и ставки в банке
            const currentPot = game.pot;
            const leavingPlayerBet = game.players.find(p => p.id === socket.user.id)?.currentBet || 0;
            const totalWinnings = currentPot + leavingPlayerBet;
            
            // Добавляем выигрыш к стеку остающегося игрока
            remainingPlayer.stack += totalWinnings;
            
            console.log(`[SERVER] Poker player left. Remaining player ${remainingPlayer.id} gets ${totalWinnings} coins (pot: ${currentPot}, leaving player bet: ${leavingPlayerBet})`);
            
            const finalState = { 
              ...game.getStateForPlayer(remainingPlayer.id), 
              status: 'finished', 
              winner: remainingPlayer, 
              isDraw: false,
              pot: 0, // Банк обнулен
              message: `Соперник покинул игру. Вы получаете ${totalWinnings} фишек!`
            };
            io.to(remainingPlayer.id).emit('game_end', finalState);
            
            // Начисляем монеты в базе только остающемуся игроку (он получает свою ставку обратно)
            gameController.finalizeGame(roomId, remainingPlayer.id, socket.user.id).then(res => {
               if (res && res.winner) io.to(res.winner.id).emit('update_coins', res.winner.coins);
            });
          } else {
            const finalState = { ...game.getStateForPlayer ? game.getStateForPlayer(remainingPlayer.id) : game.getState(), status: 'finished', winner: remainingPlayer, isDraw: false };
            io.to(roomId).emit('game_end', finalState);
            gameController.finalizeGame(roomId, remainingPlayer.id, socket.user.id).then(res => {
               if (res && res.winner) io.to(res.winner.id).emit('update_coins', res.winner.coins);
            });
          }
        }
        GameManager.removeGame(roomId);
      } else {
        const room = await GameRoom.findByPk(roomId);
        if (room && room.status === 'waiting') {
            console.log(`[SERVER] Removing player ${socket.user.id} from waiting room ${roomId}`);
            await room.update({ players: sequelize.fn('array_remove', sequelize.col('players'), socket.user.id) });
            const remainingSockets = await io.in(roomId).fetchSockets();
            const players = remainingSockets.map(s => ({ id: s.user.id, email: s.user.email }));
            io.to(roomId).emit('player_list_update', players);
        }
      }
      userRooms.delete(roomId);
    }
  };

  socket.on('leave_room', handleLeaveOrDisconnect);
  socket.on('disconnect', () => {
    console.log(`[SERVER] Socket ${socket.id} (user ${socket.user.id}) disconnected.`);
    handleLeaveOrDisconnect();
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
    server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    startBot();
    startCronJobs();
  } catch (error) {
    console.error('Unable to start the server:', error);
  }
};

startServer();