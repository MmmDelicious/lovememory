const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const { GameRoom } = require('../models');
const gameService = require('../services/game.service');
const GameManager = require('../gameLogic/GameManager');

const quizUpdateIntervals = new Map();

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
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
            if (playersInRoom[0] !== room.hostId) {
              playersInRoom = [room.hostId, ...playersInRoom.filter(id => id !== room.hostId)];
              console.log(`[SERVER] HostId reordered to first:`, playersInRoom);
            }
          } else {
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
        const playerInfo = allSocketsInRoom.map(s => ({ id: s.user.id, name: s.user.email.split('@')[0] }));
        console.log(`[SERVER] Emitting 'player_list_update' to room ${roomId} with players:`, playerInfo.map(p => p.id));
        io.to(roomId).emit('player_list_update', playerInfo);

        const updatedRoom = await room.reload();
        console.log(`[SERVER] Room players before game start:`, updatedRoom.players);
        if (updatedRoom.players.length === 2 && updatedRoom.status === 'waiting') {
          console.log(`[SERVER] Two players in room ${roomId}. Starting game...`);
          await gameService.startGame(roomId);
          const gameType = updatedRoom.gameType;
          console.log(`[SERVER] Starting game (${gameType}) with players:`, playerInfo);
          const game = GameManager.createGame(roomId, gameType, playerInfo);

          io.to(roomId).emit('game_start', { gameType, players: playerInfo });

          if (gameType === 'poker') {
              playerInfo.forEach(player => {
                  const stateForPlayer = game.getStateForPlayer(player.id);
                  io.to(player.id).emit('game_update', stateForPlayer);
              });
          } else if (gameType === 'quiz') {
              const initialState = game.getState();
              io.to(roomId).emit('game_update', initialState);
              startQuizTimerUpdates(io, roomId, game);
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
          game.players.forEach(player => {
              const stateForPlayer = game.getStateForPlayer(player.id);
              io.to(player.id).emit('game_update', stateForPlayer);
          });
        } else if (gameType === 'quiz') {
          const newState = game.getState();
          io.to(roomId).emit('game_update', newState);
          
          if (newState.status === 'finished') {
            handleQuizGameEnd(io, roomId, game);
          }
        } else {
          const newState = game.getState();
          io.to(roomId).emit('game_update', newState);
        }
        
        if (game.status === 'finished') {
          console.log(`[SERVER] Game in room ${roomId} finished. Emitting 'game_end'.`);
          
          if (gameType === 'poker') {
            game.players.forEach(player => {
              const stateForPlayer = game.getStateForPlayer(player.id);
              io.to(player.id).emit('game_end', stateForPlayer);
            });
            
            const gameState = game.getState();
            if (gameState.winner && gameState.winner !== 'draw') {
              const winnerId = typeof gameState.winner === 'object' ? gameState.winner.id : gameState.winner;
              const loserId = game.players.find(p => p.id !== winnerId).id;
              console.log(`[SERVER] Finalizing poker game. Winner: ${winnerId}, Loser: ${loserId}`);
              gameService.finalizeGame(roomId, winnerId, loserId).then(res => {
                if (res) {
                  if (res.winner) io.to(res.winner.id).emit('update_coins', res.winner.coins);
                  if (res.loser) io.to(res.loser.id).emit('update_coins', res.loser.coins);
                }
              });
            }
            
            setTimeout(() => {
              const currentGame = GameManager.getGame(roomId);
              if (currentGame && currentGame.players.every(p => p.stack > 0)) {
                console.log(`[SERVER] Starting new poker hand in room ${roomId}`);
                currentGame.startNewHand();
                currentGame.players.forEach(player => {
                  const stateForPlayer = currentGame.getStateForPlayer(player.id);
                  io.to(player.id).emit('game_update', stateForPlayer);
                });
              } else {
                GameManager.removeGame(roomId);
              }
            }, 3000);
          } else if (gameType !== 'quiz') {
            const finalState = game.getState();
            io.to(roomId).emit('game_end', finalState);
            
            if (game.winner && game.winner !== 'draw') {
              const winnerId = game.winner;
              const loserId = game.players.find(p => p !== winnerId);
              console.log(`[SERVER] Finalizing game. Winner: ${winnerId}, Loser: ${loserId}`);
              gameService.finalizeGame(roomId, winnerId, loserId).then(res => {
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

    const handleLeaveOrDisconnect = async (roomId) => {
      if (roomId && userRooms.has(roomId)) {
        console.log(`[SERVER] User ${socket.user.id} leaving room ${roomId}`);
        
        stopQuizTimerUpdates(roomId);
        
        const game = GameManager.getGame(roomId);
        if (game) {
          const remainingSockets = (await io.in(roomId).fetchSockets()).filter(s => s.id !== socket.id);
          if (remainingSockets.length === 0) {
            console.log(`[SERVER] No players left in room ${roomId}. Removing game.`);
            GameManager.removeGame(roomId);
          } else if (remainingSockets.length === 1) {
            const remainingPlayer = remainingSockets[0].user;
            console.log(`[SERVER] Only one player (${remainingPlayer.id}) left in room ${roomId}. They win by default.`);
            
            if (game.gameType === 'poker') {
              const finalState = { ...game.getStateForPlayer(remainingPlayer.id), status: 'finished', winner: remainingPlayer, isDraw: false };
              io.to(roomId).emit('game_end', finalState);
              
              gameService.finalizeGame(roomId, remainingPlayer.id, socket.user.id).then(res => {
                 if (res && res.winner) io.to(res.winner.id).emit('update_coins', res.winner.coins);
              });
            } else {
              const finalState = { ...game.getStateForPlayer ? game.getStateForPlayer(remainingPlayer.id) : game.getState(), status: 'finished', winner: remainingPlayer, isDraw: false };
              io.to(roomId).emit('game_end', finalState);
              gameService.finalizeGame(roomId, remainingPlayer.id, socket.user.id).then(res => {
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
      for (const roomId of userRooms) {
        handleLeaveOrDisconnect(roomId);
      }
    });
  });

  return io;
}

function startQuizTimerUpdates(io, roomId, game) {
  stopQuizTimerUpdates(roomId);
  
  console.log(`[SERVER] Starting quiz timer updates for room ${roomId}`);
  
  const interval = setInterval(() => {
    if (game.status !== 'in_progress') {
      console.log(`[SERVER] Quiz game in room ${roomId} is no longer in progress. Stopping timer updates.`);
      stopQuizTimerUpdates(roomId);
      return;
    }
    
    const gameState = game.getState();
    if (gameState.currentQuestion) {
      io.to(roomId).emit('game_update', gameState);
      
      if (game.isTimeUp()) {
        console.log(`[SERVER] Time is up for question in room ${roomId}. Force advancing.`);
        game.forceNextQuestion();
        
        const newState = game.getState();
        io.to(roomId).emit('game_update', newState);
        
        if (newState.status === 'finished') {
          handleQuizGameEnd(io, roomId, game);
          stopQuizTimerUpdates(roomId);
        }
      }
    }
  }, 1000);
  
  quizUpdateIntervals.set(roomId, interval);
}

function stopQuizTimerUpdates(roomId) {
  const interval = quizUpdateIntervals.get(roomId);
  if (interval) {
    clearInterval(interval);
    quizUpdateIntervals.delete(roomId);
    console.log(`[SERVER] Stopped quiz timer updates for room ${roomId}`);
  }
}

function handleQuizGameEnd(io, roomId, game) {
  console.log(`[SERVER] Quiz game in room ${roomId} finished. Processing end game.`);
  
  stopQuizTimerUpdates(roomId);
  
  const finalState = game.getState();
  io.to(roomId).emit('game_end', finalState);
  
  if (game.winner && game.winner !== 'draw') {
    const winnerId = game.winner;
    const loserId = game.players.find(p => p !== winnerId);
    console.log(`[SERVER] Finalizing quiz game. Winner: ${winnerId}, Loser: ${loserId}`);
    gameService.finalizeGame(roomId, winnerId, loserId).then(res => {
      if (res) {
        if (res.winner) io.to(res.winner.id).emit('update_coins', res.winner.coins);
        if (res.loser) io.to(res.loser.id).emit('update_coins', res.loser.coins);
      }
    });
  }
  
  GameManager.removeGame(roomId);
}

module.exports = { initSocket };