const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const { GameRoom } = require('../models');
const gameService = require('../services/game.service');
const GameManager = require('../gameLogic/GameManager');

const quizUpdateIntervals = new Map();

function initSocket(server, app) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  app.use((req, res, next) => {
    req.io = io;
    next();
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
    console.log(`[SERVER] User connected: ${socket.user.id} with socket ID ${socket.id}`);
    const userRooms = new Set();

    socket.on('join_room', async (roomId) => {
        console.log(`[SERVER] User ${socket.user.id} trying to join room ${roomId}`);
        try {
            const room = await GameRoom.findByPk(roomId);
            if (!room) {
                socket.emit('error', 'Комната не найдена.');
                return;
            }

            const allSocketsInRoom = await io.in(roomId).fetchSockets();
            const isRoomFull = allSocketsInRoom.length >= room.maxPlayers;
            console.log(`[SERVER] Room ${roomId} has ${allSocketsInRoom.length}/${room.maxPlayers} players, full: ${isRoomFull}`);

            if (isRoomFull) {
                socket.emit('error', 'Комната уже заполнена.');
                return;
            }

            await socket.join(roomId);
            userRooms.add(roomId);
            console.log(`[SERVER] User ${socket.user.id} successfully joined room ${roomId}`);
            
            const currentSockets = await io.in(roomId).fetchSockets();
            const playerInfo = currentSockets.map(s => ({ 
                id: s.user.id, 
                name: s.user.email.split('@')[0]
            }));
            console.log(`[SERVER] Room ${roomId} now has ${currentSockets.length} players:`, playerInfo.map(p => p.name));

            io.to(roomId).emit('player_list_update', playerInfo);

            if (room.status === 'waiting') {
                if (currentSockets.length >= 2) {
                    console.log(`[SERVER] Starting game in room ${roomId} with ${currentSockets.length} players`);
                    await gameService.startGame(roomId);
                    const gameType = room.gameType;

                    const playerBuyInInfo = currentSockets.map(s => ({
                        id: s.user.id,
                        name: s.user.email.split('@')[0],
                        buyInCoins: room.bet
                    }));
                    
                    const game = GameManager.createGame(roomId, gameType, playerBuyInInfo);
                    io.to(roomId).emit('game_start', { gameType, players: playerInfo, maxPlayers: room.maxPlayers });

                    if (game.gameType === 'poker') {
                        game.players.forEach(player => {
                            const stateForPlayer = game.getStateForPlayer(player.id);
                            io.to(player.id).emit('game_update', stateForPlayer);
                        });
                    } else {
                        const initialState = game.getState();
                        io.to(roomId).emit('game_update', initialState);
                    }
                }
            } else if (room.status === 'in_progress') {
                console.log(`[SERVER] User ${socket.user.id} joining in-progress game in room ${roomId}`);
                const game = GameManager.getGame(roomId);
                if (game && game.gameType === 'poker') {
                    const newPlayerInfo = {
                        id: socket.user.id,
                        name: socket.user.email.split('@')[0],
                        buyInCoins: room.bet,
                    };
                    game.addPlayer(newPlayerInfo);
                    
                    game.players.forEach(player => {
                        const stateForPlayer = game.getStateForPlayer(player.id);
                        io.to(player.id).emit('game_update', stateForPlayer);
                    });
                }
            }
        } catch (error) {
            console.error(`[SERVER] [ERROR] in 'join_room':`, error);
            socket.emit('error', 'Произошла ошибка при подключении к комнате.');
        }
    });

    socket.on('get_game_state', async (roomId) => {
      const game = GameManager.getGame(roomId);
      if (game) {
        if (game.gameType === 'poker') {
          const stateForPlayer = game.getStateForPlayer(socket.user.id);
          socket.emit('game_update', stateForPlayer);
        } else {
          const state = game.getState();
          socket.emit('game_update', state);
        }
      } else {
        try {
          const room = await GameRoom.findByPk(roomId);
          if (room && room.status === 'waiting') {
             const socketsInRoom = await io.in(roomId).fetchSockets();
             const players = socketsInRoom.map(s => ({ id: s.user.id, name: s.user.email.split('@')[0] }));
             socket.emit('game_update', {
                gameType: room.gameType,
                status: 'waiting',
                players: players,
                maxPlayers: room.maxPlayers,
                stage: 'waiting',
                message: 'Ожидание игроков...'
             });
          }
        } catch (error) {
          console.error(`[SERVER] Error checking room status:`, error);
        }
      }
    });

    socket.on('make_move', async (data) => {
      const { roomId, move } = data;
      const game = GameManager.getGame(roomId);
      if (!game) return;
      
      try {
        const gameType = game.gameType;
        game.makeMove(socket.user.id, move);

        if (gameType === 'poker') {
          game.players.forEach(player => {
              const stateForPlayer = game.getStateForPlayer(player.id);
              io.to(player.id).emit('game_update', stateForPlayer);
          });
        } else {
          const newState = game.getState();
          io.to(roomId).emit('game_update', newState);
          if (gameType === 'quiz' && newState.status === 'finished') {
            handleQuizGameEnd(io, roomId, game);
          }
        }
        
        if (game.status === 'finished') {
          io.to(roomId).emit('game_end', game.getState());
          
          if (gameType === 'poker') {
            setTimeout(async () => {
              const currentGame = GameManager.getGame(roomId);
              if (currentGame && currentGame.players.length > 1 && currentGame.players.every(p => p.stack > 0)) {
                currentGame.startNewHand();
                currentGame.players.forEach(player => {
                  const stateForPlayer = currentGame.getStateForPlayer(player.id);
                  io.to(player.id).emit('game_update', stateForPlayer);
                });
              } else if (currentGame) {
                const room = await GameRoom.findByPk(roomId);
                if (room) {
                    const updatedUsers = await gameService.finalizePokerSession(roomId, currentGame.players, room.bet);
                    if (updatedUsers) {
                        updatedUsers.forEach(user => io.to(user.id).emit('update_coins', user.coins));
                    }
                }
                GameManager.removeGame(roomId);
                io.emit('room_list_updated');
              }
            }, 5000);
          } else if (gameType !== 'quiz') {
            const finalState = game.getState();
            if (finalState.winner && finalState.winner !== 'draw') {
              const winnerId = finalState.winner;
              const loserId = game.players.find(p => p.id !== winnerId)?.id;
              if (winnerId && loserId) {
                const res = await gameService.finalizeGame(roomId, winnerId, loserId);
                if (res) {
                    if (res.winner) io.to(res.winner.id).emit('update_coins', res.winner.coins);
                    if (res.loser) io.to(res.loser.id).emit('update_coins', res.loser.coins);
                    io.emit('room_list_updated');
                }
              }
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
      if (!roomId || !userRooms.has(roomId)) return;
      
      console.log(`[SERVER] User ${socket.user.id} processing leave/disconnect for room ${roomId}`);
      const game = GameManager.getGame(roomId);

      await socket.leave(roomId);
      userRooms.delete(roomId);
      
      if (game && game.gameType === 'poker') {
        console.log(`[SERVER] Poker game detected for room ${roomId}`);
        game.handlePlayerLeave(socket.user.id);
        const playerThatLeft = game.players.find(p => p.id === socket.user.id);
        game.removePlayer(socket.user.id);

        game.players.forEach(player => {
            const stateForPlayer = game.getStateForPlayer(player.id);
            io.to(player.id).emit('game_update', stateForPlayer);
        });

        if (game.players.length < 2) {
            console.log(`[SERVER] Less than 2 players left in poker game. Finalizing session.`);
            const room = await GameRoom.findByPk(roomId);
            if (room) {
                const finalPlayers = [...game.players, playerThatLeft].filter(Boolean);
                const updatedUsers = await gameService.finalizePokerSession(roomId, finalPlayers, room.bet);
                if (updatedUsers) {
                    updatedUsers.forEach(user => io.to(user.id).emit('update_coins', user.coins));
                }
            }
            GameManager.removeGame(roomId);
            io.emit('room_list_updated');
            return; 
        }
      }
      
      stopQuizTimerUpdates(roomId);
      
      const remainingSockets = await io.in(roomId).fetchSockets();
      console.log(`[SERVER] Room ${roomId} has ${remainingSockets.length} remaining sockets after user ${socket.user.id} left`);
      
      if (remainingSockets.length === 0) {
        console.log(`[SERVER] Room ${roomId} is empty, deleting it`);
        GameManager.removeGame(roomId);
        if (await gameService.deleteRoom(roomId)) {
          console.log(`[SERVER] Room ${roomId} deleted successfully`);
          io.emit('room_list_updated');
        }
      } else {
        console.log(`[SERVER] Room ${roomId} still has ${remainingSockets.length} players, not deleting`);
        const playerInfo = remainingSockets.map(s => ({ id: s.user.id, name: s.user.email.split('@')[0] }));
        io.to(roomId).emit('player_list_update', playerInfo);

        const currentGame = GameManager.getGame(roomId);
        if (currentGame && currentGame.status === 'in_progress' && remainingSockets.length < 2) {
          const remainingPlayerId = remainingSockets[0].user.id;
          
          if (currentGame.gameType !== 'poker') {
              console.log(`[SERVER] Non-poker game with less than 2 players, ending game`);
              io.to(roomId).emit('game_end', { ...currentGame.getState(), status: 'finished', winner: {id: remainingPlayerId} });
              const res = await gameService.finalizeGame(roomId, remainingPlayerId, socket.user.id);
               if (res && res.winner) io.to(res.winner.id).emit('update_coins', res.winner.coins);
               io.emit('room_list_updated');
               GameManager.removeGame(roomId);
          }
        }
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
  const interval = setInterval(() => {
    if (game.status !== 'in_progress') {
      stopQuizTimerUpdates(roomId);
      return;
    }
    const gameState = game.getState();
    if (gameState.currentQuestion) {
      io.to(roomId).emit('game_update', gameState);
      if (game.isTimeUp()) {
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
  }
}

async function handleQuizGameEnd(io, roomId, game) {
  stopQuizTimerUpdates(roomId);
  const finalState = game.getState();
  io.to(roomId).emit('game_end', finalState);
  
  if (game.winner && game.winner !== 'draw') {
    const winnerId = game.winner;
    const loserId = game.players.find(p => p !== winnerId);
    const res = await gameService.finalizeGame(roomId, winnerId, loserId);
    if (res) {
        if (res.winner) io.to(res.winner.id).emit('update_coins', res.winner.coins);
        if (res.loser) io.to(res.loser.id).emit('update_coins', res.loser.coins);
    }
  }
  GameManager.removeGame(roomId);
}

module.exports = { initSocket };