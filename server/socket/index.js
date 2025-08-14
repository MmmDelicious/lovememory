const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const { GameRoom, User } = require('../models');
const gameService = require('../services/game.service');
const GameManager = require('../gameLogic/GameManager');

const quizUpdateIntervals = new Map();

function initSocket(server, app) {
  const defaultOrigin = process.env.CLIENT_URL || "http://localhost:5173";
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (!allowedOrigins.includes(defaultOrigin)) {
    allowedOrigins.push(defaultOrigin);
  }

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (process.env.NODE_ENV !== 'production' && /^(http:\/\/|https:\/\/)localhost:\d+/.test(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    transports: ['websocket', 'polling']
  });

  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log('[SOCKET] Authentication failed: No token provided');
      return next(new Error('Authentication error: No token provided.'));
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.log('[SOCKET] Authentication failed: Invalid token', err.message);
        return next(new Error('Authentication error: Invalid token.'));
      }
      
      console.log('[SOCKET] Authentication successful for user:', decoded.userId);
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
            // Подтягиваем профиль, чтобы был общий аватар/пол
            const userIdsForInfo = currentSockets.map(s => s.user.id);
            const usersForInfo = await User.findAll({ where: { id: userIdsForInfo }, attributes: ['id', 'email', 'gender', 'avatarUrl', 'first_name'] });
            const usersForInfoMap = new Map(usersForInfo.map(u => [u.id, u]));
            const playerInfo = currentSockets.map(s => {
                const u = usersForInfoMap.get(s.user.id);
                return {
                    id: s.user.id,
                    name: u?.first_name || u?.email?.split('@')[0] || s.user.email.split('@')[0],
                    gender: u?.gender || 'male',
                    avatarUrl: u?.avatarUrl || null,
                };
            });
            console.log(`[SERVER] Room ${roomId} now has ${currentSockets.length} players:`, playerInfo.map(p => p.name));

            io.to(roomId).emit('player_list_update', playerInfo);

            if (room.status === 'waiting') {
                if (currentSockets.length >= 2) {
                    console.log(`[SERVER] Starting game in room ${roomId} with ${currentSockets.length} players`);
                    await gameService.startGame(roomId);
                    const gameType = room.gameType;
                    
                    const userIds = currentSockets.map(s => s.user.id);
                    const users = await User.findAll({ where: { id: userIds }, attributes: ['id', 'email', 'gender', 'avatarUrl', 'first_name'] });
                    const usersMap = new Map(users.map(u => [u.id, u]));

                    const playerBuyInInfo = currentSockets.map(s => {
                        const user = usersMap.get(s.user.id);
                        return {
                            id: s.user.id,
                            name: user ? (user.first_name || user.email.split('@')[0]) : s.user.email.split('@')[0],
                            gender: user ? user.gender : 'male',
                            avatarUrl: user ? user.avatarUrl : null,
                            buyInCoins: room.bet
                        };
                    });
                    
                    const game = GameManager.createGame(roomId, gameType, playerBuyInInfo, {
                      onStateChange: (gameInstance) => {
                        if (gameInstance.gameType === 'poker' || gameInstance.gameType === 'wordle') {
                          gameInstance.players.forEach(p => {
                            const stateForPlayer = gameInstance.getStateForPlayer(p.id);
                            io.to(p.id).emit('game_update', stateForPlayer);
                          });
                        } else {
                          const newState = gameInstance.getState();
                          io.to(roomId).emit('game_update', newState);
                        }
                      }
                    });
                    io.to(roomId).emit('game_start', { gameType, players: playerInfo, maxPlayers: room.maxPlayers });

                    if (game.gameType === 'poker' || game.gameType === 'wordle') {
                        game.players.forEach(player => {
                            const stateForPlayer = game.getStateForPlayer(player.id);
                            io.to(player.id).emit('game_update', stateForPlayer);
                        });
                    } else if (game.gameType === 'quiz') {
                        // Запускаем таймер для квиза
                        startQuizTimerUpdates(io, roomId, game);
                        const initialState = game.getState();
                        io.to(roomId).emit('game_update', initialState);
                    } else {
                        const initialState = game.getState();
                        io.to(roomId).emit('game_update', initialState);
                    }
                }
            } else if (room.status === 'in_progress') {
                console.log(`[SERVER] User ${socket.user.id} joining in-progress game in room ${roomId}`);
                const game = GameManager.getGame(roomId);
                if (game && game.gameType === 'poker') {
                    const user = await User.findByPk(socket.user.id, { attributes: ['id', 'email', 'gender'] });
                    const newPlayerInfo = {
                        id: socket.user.id,
                        name: user ? user.email.split('@')[0] : socket.user.email.split('@')[0],
                        gender: user ? user.gender : 'male',
                        buyInCoins: room.bet,
                    };
                    
                    // Проверяем, есть ли уже такой игрок в игре
                    const existingPlayer = game.players.find(p => p.id === socket.user.id);
                    if (existingPlayer) {
                        // Игрок переподключается - обновляем его статус
                        existingPlayer.isWaitingToPlay = false;
                        console.log(`[SERVER] Player ${socket.user.id} reconnected to existing game`);
                    } else {
                        // Новый игрок присоединяется как наблюдатель
                        game.addPlayer(newPlayerInfo);
                        console.log(`[SERVER] Player ${socket.user.id} joined as observer`);
                    }
                    
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
        if (game.gameType === 'poker' || game.gameType === 'wordle') {
          const stateForPlayer = game.getStateForPlayer(socket.user.id);
          socket.emit('game_update', stateForPlayer);
        } else {
          const state = game.getState();
          socket.emit('game_update', state);
        }
      } else {
        try {
          const room = await GameRoom.findByPk(roomId);
          if (room) {
            if (room.status === 'waiting') {
              const socketsInRoom = await io.in(roomId).fetchSockets();
              const players = socketsInRoom.map(s => ({ id: s.user.id, name: s.user.email.split('@')[0] }));
              socket.emit('game_update', {
                gameType: room.gameType,
                status: 'waiting',
                players: players,
                maxPlayers: room.maxPlayers,
                stage: 'waiting'
              });
            } else if (room.status === 'in_progress') {
              // Игра была в процессе, но GameManager сбросился при перезагрузке сервера
              console.log(`[SERVER] Recovering game for room ${roomId} after server restart`);
              
              const socketsInRoom = await io.in(roomId).fetchSockets();
                if (socketsInRoom.length >= 2) {
                // Восстанавливаем игру
                const userIds = socketsInRoom.map(s => s.user.id);
                const users = await User.findAll({ where: { id: userIds }, attributes: ['id', 'email', 'gender'] });
                const usersMap = new Map(users.map(u => [u.id, u]));

                const playerBuyInInfo = socketsInRoom.map(s => {
                  const user = usersMap.get(s.user.id);
                  return {
                    id: s.user.id,
                    name: user ? user.email.split('@')[0] : s.user.email.split('@')[0],
                    gender: user ? user.gender : 'male',
                    buyInCoins: room.bet
                  };
                });
                
                const recoveredGame = GameManager.createGame(roomId, room.gameType, playerBuyInInfo, {
                  onStateChange: (gameInstance) => {
                    if (gameInstance.gameType === 'poker') {
                      gameInstance.players.forEach(p => {
                        const stateForPlayer = gameInstance.getStateForPlayer(p.id);
                        io.to(p.id).emit('game_update', stateForPlayer);
                      });
                    } else {
                      const newState = gameInstance.getState();
                      io.to(roomId).emit('game_update', newState);
                    }
                  }
                });
                
                if (recoveredGame.gameType === 'poker') {
                  recoveredGame.players.forEach(player => {
                    const stateForPlayer = recoveredGame.getStateForPlayer(player.id);
                    io.to(player.id).emit('game_update', stateForPlayer);
                  });
                } else if (recoveredGame.gameType === 'quiz') {
                  // Запускаем таймер для восстановленного квиза
                  startQuizTimerUpdates(io, roomId, recoveredGame);
                  const initialState = recoveredGame.getState();
                  io.to(roomId).emit('game_update', initialState);
                } else {
                  const initialState = recoveredGame.getState();
                  io.to(roomId).emit('game_update', initialState);
                }
              } else {
                // Недостаточно игроков для восстановления
                socket.emit('game_update', {
                  gameType: room.gameType,
                  status: 'waiting',
                  players: socketsInRoom.map(s => ({ id: s.user.id, name: s.user.email.split('@')[0] })),
                  maxPlayers: room.maxPlayers,
                  stage: 'waiting'
                });
              }
            }
          }
        } catch (error) {
          console.error(`[SERVER] Error checking room status:`, error);
        }
      }
    });

    socket.on('make_move', async (data) => {
      const { roomId, move } = data;
      console.log(`[SOCKET] make_move received: roomId=${roomId}, move=`, move);
      const game = GameManager.getGame(roomId);
      if (!game) {
        console.log(`[SOCKET] Game not found for roomId: ${roomId}`);
        return;
      }
      
      try {
        const gameType = game.gameType;
        console.log(`[SOCKET] Making move for game type: ${gameType}, player: ${socket.user.id}`);
        
        const moveResult = game.makeMove(socket.user.id, move);

        // Отправляем результат хода игроку
        if (moveResult && moveResult.error) {
          socket.emit('move_error', { error: moveResult.error });
          return;
        }

        if (gameType === 'poker' || gameType === 'wordle') {
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
          if (gameType === 'poker') {
            // Для покера отправляем персонализированное финальное состояние (с yourHand)
            game.players.forEach(player => {
              const finalStateForPlayer = game.getStateForPlayer(player.id);
              io.to(player.id).emit('game_end', finalStateForPlayer);
            });
            setTimeout(async () => {
              const currentGame = GameManager.getGame(roomId);
              if (currentGame && currentGame.players.length > 1 && currentGame.players.every(p => p.stack > 0)) {
                currentGame.startNewHand();
                
                // Отправляем состояние всем игрокам сразу
                currentGame.players.forEach(player => {
                  const stateForPlayer = currentGame.getStateForPlayer(player.id);
                  io.to(player.id).emit('game_update', stateForPlayer);
                });
                
                // Отправляем событие о начале новой раздачи после обновления состояния
                io.to(roomId).emit('new_hand_started', { 
                  gameType: 'poker', 
                  players: currentGame.players.map(p => ({ id: p.id, name: p.name }))
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
          } else {
            io.to(roomId).emit('game_end', game.getState());
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
        // Отправляем более дружелюбные сообщения об ошибках
        let userMessage = error.message;
        if (error.message === 'Not your turn') {
          userMessage = 'Сейчас не ваш ход';
        } else if (error.message === 'Cell is already taken') {
          userMessage = 'Эта клетка уже занята';
        } else if (error.message === 'Game is already over') {
          userMessage = 'Игра уже завершена';
        } else if (error.message === 'Invalid move position') {
          userMessage = 'Некорректная позиция хода';
        }
        socket.emit('error', userMessage);
      }
    });

    socket.on('rebuy', async (data) => {
      const { roomId } = data;
      const game = GameManager.getGame(roomId);
      if (!game || game.gameType !== 'poker') {
        socket.emit('error', 'Rebuy is only available in poker games.');
        return;
      }

      try {
        const player = game.players.find(p => p.id === socket.user.id);
        if (!player) {
          socket.emit('error', 'Player not found in game.');
          return;
        }

        const room = await GameRoom.findByPk(roomId);
        if (!room) {
          socket.emit('error', 'Room not found.');
          return;
        }

        const user = await User.findByPk(socket.user.id);
        if (!user) {
          socket.emit('error', 'User not found.');
          return;
        }

        // Проверяем, что у пользователя достаточно монет для ребая
        const rebuyAmount = room.bet - player.stack;
        if (rebuyAmount <= 0) {
          socket.emit('error', 'No rebuy needed.');
          return;
        }

        if (user.coins < rebuyAmount) {
          socket.emit('error', `Insufficient coins for rebuy. Need ${rebuyAmount} coins, have ${user.coins}.`);
          return;
        }

        // Выполняем ребай
        user.coins -= rebuyAmount;
        player.stack += rebuyAmount;
        await user.save();

        // Отправляем обновленное состояние всем игрокам
        game.players.forEach(gamePlayer => {
          const stateForPlayer = game.getStateForPlayer(gamePlayer.id);
          io.to(gamePlayer.id).emit('game_update', stateForPlayer);
        });

        // Отправляем обновленные монеты пользователю
        socket.emit('update_coins', user.coins);
        socket.emit('rebuy_success', { newStack: player.stack });

        console.log(`[SERVER] User ${socket.user.id} rebought ${rebuyAmount} coins. New stack: ${player.stack}`);

      } catch (error) {
        console.error(`[SERVER] [ERROR] in 'rebuy':`, error.message);
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
        const remainingIds = remainingSockets.map(s => s.user.id);
        try {
          const remainingUsers = await User.findAll({ where: { id: remainingIds }, attributes: ['id', 'email', 'gender', 'avatarUrl', 'first_name'] });
          const remap = new Map(remainingUsers.map(u => [u.id, u]));
          const playerInfo = remainingSockets.map(s => {
            const u = remap.get(s.user.id);
            return {
              id: s.user.id,
              name: u?.first_name || u?.email?.split('@')[0] || s.user.email.split('@')[0],
              gender: u?.gender || 'male',
              avatarUrl: u?.avatarUrl || null,
            };
          });
          io.to(roomId).emit('player_list_update', playerInfo);
        } catch (e) {
          const fallback = remainingSockets.map(s => ({ id: s.user.id, name: s.user.email.split('@')[0] }));
          io.to(roomId).emit('player_list_update', fallback);
        }

        // Проверяем, нужно ли завершить игру из-за недостатка игроков
        const currentGame = GameManager.getGame(roomId);
        if (currentGame && currentGame.status === 'in_progress' && remainingSockets.length < 2) {
          if (currentGame.gameType !== 'poker') {
              console.log(`[SERVER] Non-poker game with less than 2 players, ending game`);
              const remainingPlayerId = remainingSockets[0].user.id;
              io.to(roomId).emit('game_end', { ...currentGame.getState(), status: 'finished', winner: {id: remainingPlayerId} });
              const res = await gameService.finalizeGame(roomId, remainingPlayerId, socket.user.id);
               if (res && res.winner) io.to(res.winner.id).emit('update_coins', res.winner.coins);
               io.emit('room_list_updated');
               GameManager.removeGame(roomId);
          } else {
              // Для покера - оставляем игру в покое, игрок может вернуться
              console.log(`[SERVER] Poker game with less than 2 players, keeping game active for potential rejoin`);
              // Переводим комнату в статус ожидания, если в комнате остался 1 игрок
              try {
                const room = await GameRoom.findByPk(roomId);
                if (room) {
                  room.status = 'waiting';
                  await room.save();
                  io.emit('room_list_updated');
                }
              } catch (e) {
                console.warn('[SERVER] Failed to mark room as waiting for poker:', e.message);
              }
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