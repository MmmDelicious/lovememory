const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const { GameRoom, User } = require('../models');
const gameService = require('../services/game.service');
const economyService = require('../services/economy.service');
// Временная заглушка GameManager до исправления TS импортов
const GameManager = {
  createGame: (roomId, gameType, playerInfo, options) => {
    console.log(`🎮 [STUB] Creating game ${gameType} for room ${roomId}`);
    return { gameState: 'waiting', players: [], roomId };
  },
  getGame: (roomId) => {
    console.log(`🎮 [STUB] Getting game for room ${roomId}`);
    return null; // Временно возвращаем null
  },
  removeGame: (roomId) => {
    console.log(`🎮 [STUB] Removing game for room ${roomId}`);
  }
};

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
            console.log(`[SOCKET] Player joining room`, {
              timestamp: new Date().toISOString(),
              roomId,
              userId: socket.user.id,
              userEmail: socket.user.email
            });

            const room = await GameRoom.findByPk(roomId);
            if (!room) {
                console.error(`❌ [SOCKET] Room not found`, {
                  timestamp: new Date().toISOString(),
                  roomId,
                  userId: socket.user.id
                });
                socket.emit('error', 'Room not found.');
                return;
            }

            console.log(`🏠 [SOCKET] Room found`, {
              timestamp: new Date().toISOString(),
              roomId: room.id,
              gameType: room.gameType,
              status: room.status,
              maxPlayers: room.maxPlayers,
              bet: room.bet
            });

            const allSocketsInRoom = await io.in(roomId).fetchSockets();
            const isRoomFull = allSocketsInRoom.length >= room.maxPlayers;

            console.log(`👥 [SOCKET] Checking room capacity`, {
              timestamp: new Date().toISOString(),
              roomId,
              currentPlayers: allSocketsInRoom.length,
              maxPlayers: room.maxPlayers,
              isRoomFull
            });

            if (isRoomFull) {
                console.error(`❌ [SOCKET] Room is full`, {
                  timestamp: new Date().toISOString(),
                  roomId,
                  currentPlayers: allSocketsInRoom.length,
                  maxPlayers: room.maxPlayers
                });
                socket.emit('error', 'Room is already full.');
                return;
            }

            const economyType = economyService.getEconomyType(room.gameType);
            console.log(`[SOCKET] Checking economy type`, {
              timestamp: new Date().toISOString(),
              roomId,
              gameType: room.gameType,
              economyType,
              roomStatus: room.status
            });

            if (economyType === 'standard' && room.status === 'waiting') {
                console.log(`💸 [SOCKET] Reserving player bet for standard game`, {
                  timestamp: new Date().toISOString(),
                  roomId,
                  userId: socket.user.id,
                  bet: room.bet
                });

                const betResult = await economyService.reservePlayerBet(socket.user.id, roomId, room.bet);
                if (!betResult.success) {
                    console.error(`❌ [SOCKET] Failed to reserve bet`, {
                      timestamp: new Date().toISOString(),
                      roomId,
                      userId: socket.user.id,
                      reason: betResult.reason
                    });
                    socket.emit('error', betResult.reason);
                    return;
                }

                console.log(`✅ [SOCKET] Bet reserved successfully`, {
                  timestamp: new Date().toISOString(),
                  roomId,
                  userId: socket.user.id,
                  newBalance: betResult.newBalance
                });
                socket.emit('update_coins', betResult.newBalance);
            } else {
                console.log(`[SOCKET] Skipping bet reservation`, {
                  timestamp: new Date().toISOString(),
                  roomId,
                  economyType,
                  roomStatus: room.status,
                  reason: economyType === 'poker' ? 'Poker uses buy-in system' : 'Game already in progress'
                });
            }

            await socket.join(roomId);
            userRooms.add(roomId);
            
            console.log(`🔗 [SOCKET] Player joined room successfully`, {
              timestamp: new Date().toISOString(),
              roomId,
              userId: socket.user.id
            });

            socket.emit('room_info', {
                id: room.id,
                gameType: room.gameType,
                status: room.status,
                bet: room.bet,
                maxPlayers: room.maxPlayers
            });

            console.log(`📤 [SOCKET] Sent room_info to player`, {
              timestamp: new Date().toISOString(),
              roomId,
              userId: socket.user.id,
              roomInfo: {
                id: room.id,
                gameType: room.gameType,
                status: room.status,
                bet: room.bet,
                maxPlayers: room.maxPlayers
              }
            });
            
            const currentSockets = await io.in(roomId).fetchSockets();
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

            io.to(roomId).emit('player_list_update', playerInfo);

            if (room.status === 'waiting') {
                let requiredPlayers = 2;
                if (room.gameType === 'poker') {
                  requiredPlayers = 1;
                } else if (room.gameType === 'codenames') {
                  requiredPlayers = 4;
                } else if ((room.gameType === 'wordle' || room.gameType === 'quiz') && room.maxPlayers === 4) {
                  requiredPlayers = 4;
                }
                
                const shouldCreateGame = currentSockets.length >= requiredPlayers;
                
                console.log(`[SOCKET] Checking game creation conditions`, {
                  timestamp: new Date().toISOString(),
                  roomId,
                  gameType: room.gameType,
                  currentPlayers: currentSockets.length,
                  requiredPlayers,
                  shouldCreateGame
                });
                
                if (shouldCreateGame) {
                    console.log(`[SOCKET] Creating game - conditions met!`, {
                      timestamp: new Date().toISOString(),
                      roomId,
                      gameType: room.gameType,
                      players: currentSockets.length
                    });
                    if (room.gameType !== 'poker') {
                        await gameService.startGame(roomId);
                    }
                    
                    const gameType = room.gameType;
                    
                    const userIds = currentSockets.map(s => s.user.id);
                    const users = await User.findAll({ where: { id: userIds }, attributes: ['id', 'email', 'gender', 'avatarUrl', 'first_name'] });
                    const usersMap = new Map(users.map(u => [u.id, u]));

                    const playerInfo = currentSockets.map(s => {
                        const user = usersMap.get(s.user.id);
                        return {
                            id: s.user.id,
                            name: user ? (user.first_name || user.email.split('@')[0]) : s.user.email.split('@')[0],
                            gender: user ? user.gender : 'male',
                            avatarUrl: user ? user.avatarUrl : null,
                            ...(gameType === 'poker' ? { buyInCoins: room.bet } : { buyInCoins: room.bet })
                        };
                    });
                    
                    const gameOptions = {
                      onStateChange: (gameState) => {
                        const gameInstance = GameManager.getGame(roomId);
                        
                        if (!gameInstance) {
                          console.error('[SOCKET] Game instance not found for state change callback');
                          return;
                        }
                        
                        if (gameInstance.gameType === 'poker' || gameInstance.gameType === 'wordle') {
                          gameInstance.players.forEach(p => {
                            const stateForPlayer = gameInstance.getStateForPlayer(p.id);
                            io.to(p.id).emit('game_update', stateForPlayer);
                          });
                        } else if (gameInstance.gameType === 'memory') {
                          const newState = gameInstance.getGameState ? gameInstance.getGameState() : gameState;
                          io.to(roomId).emit('game_update', newState);
                        } else {
                          const newState = gameState || gameInstance.getState();
                          io.to(roomId).emit('game_update', newState);
                        }
                      },
                      onGameStart: gameType === 'poker' ? async () => {
                        try {
                          await gameService.startGame(roomId);
                          io.emit('room_list_updated');
                        } catch (error) {
                        }
                      } : undefined,
                      gameFormat: room.gameFormat || '1v1'
                    };

                    if (room.settings) {
                      Object.assign(gameOptions, room.settings);
                    }

                    console.log(`🎲 [SOCKET] Creating game instance via GameManager`, {
                      timestamp: new Date().toISOString(),
                      roomId,
                      gameType,
                      playerCount: playerInfo.length,
                      gameOptions: Object.keys(gameOptions)
                    });

                    const game = GameManager.createGame(roomId, gameType, playerInfo, gameOptions);

                    console.log(`✅ [SOCKET] Game instance created successfully`, {
                      timestamp: new Date().toISOString(),
                      roomId,
                      gameType: game.gameType,
                      status: game.status,
                      playersInGame: game.players?.length || 0
                    });

                    io.to(roomId).emit('game_start', { gameType, players: playerInfo, maxPlayers: room.maxPlayers });

                    console.log(`📢 [SOCKET] Sent game_start event to room`, {
                      timestamp: new Date().toISOString(),
                      roomId,
                      gameType,
                      playersCount: playerInfo.length
                    });

                    if (game.gameType === 'poker') {
                        console.log(`🃏 [SOCKET] Handling poker game initialization`, {
                          timestamp: new Date().toISOString(),
                          roomId,
                          connectedUsers: currentSockets.length
                        });

                        // Для покера добавляем игроков как observers (без buy-in)
                        // Потом они смогут сделать buy-in через отдельный обработчик
                        currentSockets.forEach(socketInRoom => {
                            // Добавляем игрока как observer, если его еще нет в игре
                            const playerInGame = game.getPlayer ? game.getPlayer(socketInRoom.user.id) : null;
                            if (!playerInGame) {
                                console.log(`👥 [SOCKET] Adding player as observer to poker game`, {
                                  timestamp: new Date().toISOString(),
                                  roomId,
                                  userId: socketInRoom.user.id,
                                  userName: socketInRoom.user.name || socketInRoom.user.email
                                });
                                
                                // Добавляем игрока в poker engine как observer (без фишек)
                                const addResult = game.addPlayer(socketInRoom.user.id, socketInRoom.user.name || socketInRoom.user.email, 0);
                                if (!addResult) {
                                    console.error(`❌ [SOCKET] Failed to add player as observer`, {
                                      timestamp: new Date().toISOString(),
                                      roomId,
                                      userId: socketInRoom.user.id
                                    });
                                }
                            }
                            
                            // Получаем состояние для каждого пользователя
                            const stateForUser = game.getStateForPlayer(socketInRoom.user.id);
                            
                            console.log(`📤 [SOCKET] Sending poker state to user`, {
                              timestamp: new Date().toISOString(),
                              roomId,
                              userId: socketInRoom.user.id,
                              needsBuyIn: stateForUser?.needsBuyIn,
                              hasBoughtIn: stateForUser?.hasBoughtIn,
                              playersInGame: stateForUser?.players?.length || 0
                            });

                            io.to(socketInRoom.user.id).emit('game_update', stateForUser);
                        });
                    } else if (game.gameType === 'wordle') {
                        game.players.forEach(player => {
                            const stateForPlayer = game.getStateForPlayer(player.id);
                            io.to(player.id).emit('game_update', stateForPlayer);
                        });
                    } else if (game.gameType === 'codenames') {
                        game.players.forEach(playerId => {
                            const playerRole = game.getPlayerRoleOld ? game.getPlayerRoleOld(playerId) : game.getPlayerRole(playerId);
                            let stateForPlayer;
                            if (playerRole && playerRole.role === 'captain') {
                                stateForPlayer = game.getCaptainState(playerId);
                            } else {
                                stateForPlayer = game.getState();
                            }
                            io.to(playerId).emit('game_update', stateForPlayer);
                        });
                    } else if (game.gameType === 'memory') {
                        const initialState = game.getGameState();
                        io.to(roomId).emit('game_update', initialState);
                    } else if (game.gameType === 'quiz') {
                        startQuizTimerUpdates(io, roomId, game);
                        const initialState = game.getState();
                        io.to(roomId).emit('game_update', initialState);
                    } else {
                        const initialState = game.getState();
                        io.to(roomId).emit('game_update', initialState);
                    }
                }
            } else if (room.status === 'in_progress') {
                const game = GameManager.getGame(roomId);
                if (game && game.gameType === 'poker') {
                    // Для покера НЕ добавляем игроков автоматически в активную игру
                    // Пользователь подключается как наблюдатель
                    // Если он хочет играть, должен сделать buy-in через отдельный обработчик
                    
                    // Отправляем текущее состояние игры пользователю (как наблюдателю)
                    const stateForUser = game.getStateForPlayer(socket.user.id);
                    io.to(socket.user.id).emit('game_update', stateForUser);
                }
            }
        } catch (error) {
            console.error(`[SERVER] [ERROR] in 'join_room':`, error);
            socket.emit('error', 'An error occurred while connecting to the room.');
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
              
              const socketsInRoom = await io.in(roomId).fetchSockets();
                if (socketsInRoom.length >= 2) {
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
                  onStateChange: (gameState) => {
                    const gameInstance = GameManager.getGame(roomId);
                    
                    if (!gameInstance) {
                      console.error('[SOCKET] Game instance not found for recovery state change callback');
                      return;
                    }
                    
                    if (gameInstance.gameType === 'poker') {
                      gameInstance.players.forEach(p => {
                        const stateForPlayer = gameInstance.getStateForPlayer(p.id);
                        io.to(p.id).emit('game_update', stateForPlayer);
                      });
                    } else {
                      const newState = gameState || gameInstance.getState();
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
                  startQuizTimerUpdates(io, roomId, recoveredGame);
                  const initialState = recoveredGame.getState();
                  io.to(roomId).emit('game_update', initialState);
                } else {
                  const initialState = recoveredGame.getState();
                  io.to(roomId).emit('game_update', initialState);
                }
              } else {
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

    socket.on('player_ready', async (data) => {
      const { roomId } = data;
      const game = GameManager.getGame(roomId);
      if (!game) {
        return;
      }
      
      try {
        if (game.gameType === 'memory' && typeof game.setPlayerReady === 'function') {
          game.setPlayerReady(socket.user.id);
          const newState = game.getGameState();
          io.to(roomId).emit('game_update', newState);
        }
      } catch (error) {
        console.error(`[SERVER] [ERROR] in 'player_ready':`, error.message);
        socket.emit('error', error.message);
      }
    });

    socket.on('make_move', async (data) => {
      console.log(`🎯 [SOCKET] make_move received`, {
        timestamp: new Date().toISOString(),
        roomId: data.roomId,
        userId: socket.user.id,
        userEmail: socket.user.email,
        data,
        rawData: JSON.stringify(data)
      });

      // Обрабатываем и старый {action, value} и новый {move} форматы
      const { roomId, action, value, move } = data;
      
      // Если есть move, то это новый формат, иначе старый {action, value}
      let finalMove;
      if (move !== undefined) {
        finalMove = move;
      } else {
        finalMove = { action, value };
      }
      const game = GameManager.getGame(roomId);
      if (!game) {
        console.error(`❌ [SOCKET] Game not found for room ${roomId}`);
        socket.emit('move_error', { error: 'Game not found' });
        return;
      }

      console.log(`🎮 [SOCKET] Game found for poker action`, {
        gameType: game.gameType,
        gameStatus: game.status,
        playersCount: game.players?.length || 0
      });
      
      try {
        const gameType = game.gameType;
        
        let moveResult;
        if (gameType === 'memory') {
          try {
            // Для memory используем специальный flipCard метод
            moveResult = game.flipCard(socket.user.id, finalMove);
          } catch (error) {
            console.error(`[MEMORY] Error in flipCard:`, error.message);
            socket.emit('move_error', { error: error.message });
            return;
          }
        } else if (gameType === 'poker') {
          try {
            // Для покера используем стандартный makeMove интерфейс  
            const pokerMove = finalMove.action ? { action: finalMove.action, amount: finalMove.value } : finalMove;
            console.log(`🃏 [SOCKET] Processing poker action`, {
              timestamp: new Date().toISOString(),
              roomId,
              userId: socket.user.id,
              originalMove: finalMove,
              pokerMove,
              gameStage: game.getGameState ? game.getGameState().stage : 'unknown',
              currentTurnSeat: game.getGameState ? game.getGameState().currentTurnSeat : 'unknown'
            });

            // Проверяем валидность хода ПЕРЕД выполнением
            const isValid = game.isValidMove ? game.isValidMove(socket.user.id, pokerMove) : true;
            console.log(`🔍 [SOCKET] Move validation result:`, { isValid, move: pokerMove });

            moveResult = game.makeMove(socket.user.id, pokerMove);
            
            console.log(`✅ [SOCKET] Poker move executed successfully`, {
              move: pokerMove,
              moveResultType: typeof moveResult,
              hasResult: !!moveResult
            });

          } catch (error) {
            console.error(`❌ [SOCKET] Error in poker makeMove:`, {
              error: error.message,
              stack: error.stack,
              move: finalMove,
              userId: socket.user.id,
              roomId
            });
            socket.emit('move_error', { error: error.message });
            return;
          }
        } else {
          try {
            console.log(`🎮 [SOCKET] Processing ${gameType} move:`, {
              userId: socket.user.id,
              originalData: data,
              finalMove,
              moveType: typeof finalMove
            });
            moveResult = game.makeMove(socket.user.id, finalMove);
          } catch (error) {
            console.error(`❌ [SOCKET] Error in ${gameType} makeMove:`, {
              error: error.message,
              move: finalMove,
              userId: socket.user.id,
              gameType
            });
            socket.emit('move_error', { error: error.message });
            return;
          }
        }

        if (moveResult && moveResult.error) {
          socket.emit('move_error', { error: moveResult.error });
          return;
        }

        if (gameType === 'poker' || gameType === 'wordle') {
          if (gameType === 'poker') {
            // Для покера отправляем состояние всем игрокам в комнате
            console.log(`📤 [SOCKET] Sending poker state updates to all players`);
            const connectedSockets = await io.in(roomId).fetchSockets();
            connectedSockets.forEach(socketInRoom => {
              const stateForPlayer = game.getStateForPlayer(socketInRoom.user.id);
              console.log(`📨 [SOCKET] Sending state to player ${socketInRoom.user.id}`, {
                stage: stateForPlayer?.stage,
                currentPlayerId: stateForPlayer?.currentPlayerId,
                validActions: stateForPlayer?.validActions,
                showdownPhase: stateForPlayer?.showdownPhase
              });
              io.to(socketInRoom.user.id).emit('game_update', stateForPlayer);
            });
          } else {
            game.players.forEach(playerId => {
              const stateForPlayer = game.getStateForPlayer(playerId);
              io.to(playerId).emit('game_update', stateForPlayer);
            });
          }
        } else if (gameType === 'codenames') {
          game.players.forEach(playerId => {
            const playerRole = game.getPlayerRoleOld ? game.getPlayerRoleOld(playerId) : game.getPlayerRole(playerId);
            let stateForPlayer;
            if (playerRole && playerRole.role === 'captain') {
              stateForPlayer = game.getCaptainState(playerId);
            } else {
              stateForPlayer = game.getState();
            }
            io.to(playerId).emit('game_update', stateForPlayer);
          });
        } else if (gameType === 'memory') {
          try {
            const newState = game.getGameState();
            if (newState.status === 'error') {
              console.error(`[MEMORY] Game state error:`, newState.error);
              socket.emit('move_error', { error: newState.error || 'Game state error' });
              return;
            }
            io.to(roomId).emit('game_update', newState);
          } catch (error) {
            console.error(`[MEMORY] Error getting game state:`, error.message);
            socket.emit('move_error', { error: 'Error getting game state' });
            return;
          }
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
                      if (gameType === 'memory') {
            try {
              const finalState = game.getGameState();
              if (finalState.status === 'error') {
                console.error(`[MEMORY] Final state error:`, finalState.error);
                return;
              }
              io.to(roomId).emit('game_end', finalState);
              
              const room = await GameRoom.findByPk(roomId);
              if (room && economyService.getEconomyType(room.gameType) === 'standard') {
                const winnerId = finalState.winner?.id;
                const playerIds = game.players.map(p => p.id);
                
                const economyResult = await economyService.finalizeStandardGame(roomId, winnerId, playerIds, false);
                if (economyResult.success) {
                  Object.keys(economyResult.results.playerResults || {}).forEach(playerId => {
                    const playerResult = economyResult.results.playerResults[playerId];
                    io.to(playerId).emit('update_coins', playerResult.newBalance);
                  });
                  io.emit('room_list_updated');
                }
              }
              
              setTimeout(() => {
                GameManager.removeGame(roomId);
              }, 5000);
            } catch (error) {
              console.error(`[MEMORY] Error handling game end:`, error.message);
            }
          } else if (gameType === 'poker') {
            game.players.forEach(player => {
              const finalStateForPlayer = game.getStateForPlayer(player.id);
              io.to(player.id).emit('game_end', finalStateForPlayer);
            });
            setTimeout(async () => {
              const currentGame = GameManager.getGame(roomId);
              
              if (!currentGame) {
                return;
              }
              
              const activePlayers = currentGame.players.filter(p => p.hasBoughtIn);
              const playersWithMoney = activePlayers.filter(p => p.stack > 0);
              
              if (activePlayers.length >= 2) {
                if (playersWithMoney.length >= 2) {
                  currentGame.startNewHand();
                  
                  currentGame.players.forEach(player => {
                    const stateForPlayer = currentGame.getStateForPlayer(player.id);
                    io.to(player.id).emit('game_update', stateForPlayer);
                  });
                  
                  io.to(roomId).emit('new_hand_started', { 
                    gameType: 'poker', 
                    players: currentGame.players.map(p => ({ id: p.id, name: p.name }))
                  });
                } else {
                  currentGame.status = 'waiting';
                  
                  currentGame.players.forEach(player => {
                    const stateForPlayer = currentGame.getStateForPlayer(player.id);
                    io.to(player.id).emit('game_update', stateForPlayer);
                  });
                  
                  io.to(roomId).emit('rebuy_opportunity', {
                    message: 'Players can make rebuy to continue game'
                  });
                }
              } else {
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
            }, 4000);
                  } else if (gameType === 'memory') {
                    const finalState = game.getGameState();
                    
                    const room = await GameRoom.findByPk(roomId);
                    if (room && economyService.getEconomyType(room.gameType) === 'standard') {
                      const winnerId = finalState.winner?.id;
                      const playerIds = game.players.map(p => p.id);
                      
                      const economyResult = await economyService.finalizeStandardGame(roomId, winnerId, playerIds, false);
                      if (economyResult.success) {
                        Object.keys(economyResult.results.playerResults || {}).forEach(playerId => {
                          const playerResult = economyResult.results.playerResults[playerId];
                          io.to(playerId).emit('update_coins', playerResult.newBalance);
                        });
                        io.emit('room_list_updated');
                      }
                    }
                    
                    io.to(roomId).emit('game_end', finalState);
                    
                    setTimeout(() => {
                      GameManager.removeGame(roomId);
                    }, 5000);
                  } else {
                    const finalState = game.getState();
            
            const room = await GameRoom.findByPk(roomId);
            if (room && economyService.getEconomyType(room.gameType) === 'standard') {
              const isDraw = finalState.winner === 'draw' || finalState.isDraw;
              const winnerId = isDraw ? null : finalState.winner;
              const playerIds = game.players.map(p => p.id || p);
              
              const economyResult = await economyService.finalizeStandardGame(roomId, winnerId, playerIds, isDraw);
              if (economyResult.success) {
                const enhancedGameState = {
                  ...finalState,
                  economyResults: economyResult.results.playerResults
                };
                
                io.to(roomId).emit('game_end', enhancedGameState);
                
                // Send updated balances to all players
                Object.keys(economyResult.results.playerResults || {}).forEach(playerId => {
                  const playerResult = economyResult.results.playerResults[playerId];
                  io.to(playerId).emit('update_coins', playerResult.newBalance);
                });
                io.emit('room_list_updated');
              } else {
                io.to(roomId).emit('game_end', finalState);
              }
                          } else {
              io.to(roomId).emit('game_end', finalState);
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
            }
            GameManager.removeGame(roomId);
          }
        }
      } catch (error) {
        console.error(`[SERVER] [ERROR] in 'make_move':`, error.message);
        // Send more user-friendly error messages
        let userMessage = error.message;
        if (error.message === 'Not your turn') {
          userMessage = 'Not your turn now';
        } else if (error.message === 'Cell is already taken') {
          userMessage = 'This cell is already taken';
        } else if (error.message === 'Game is already over') {
          userMessage = 'Game is already over';
        } else if (error.message === 'Invalid move position') {
          userMessage = 'Invalid move position';
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

        const rebuyAmount = room.bet - player.stack;
        if (rebuyAmount <= 0) {
          socket.emit('error', 'No rebuy needed.');
          return;
        }

        if (user.coins < rebuyAmount) {
          socket.emit('error', `Insufficient coins for rebuy. Need ${rebuyAmount} coins, have ${user.coins}.`);
          return;
        }

        user.coins -= rebuyAmount;
        player.stack += rebuyAmount;
        await user.save();

        game.players.forEach(gamePlayer => {
          const stateForPlayer = game.getStateForPlayer(gamePlayer.id);
          io.to(gamePlayer.id).emit('game_update', stateForPlayer);
        });

        socket.emit('update_coins', user.coins);
        socket.emit('rebuy_success', { newStack: player.stack });

      } catch (error) {
        console.error(`[SERVER] [ERROR] in 'rebuy':`, error.message);
        socket.emit('error', error.message);
      }
    });

    socket.on('poker_buy_in', async (data) => {
      const { roomId, buyInAmount } = data;
      
      try {
        const room = await GameRoom.findByPk(roomId);
        if (!room || room.gameType !== 'poker') {
          socket.emit('error', 'Poker buy-in is only available in poker rooms');
          return;
        }

        // Check limits
        if (buyInAmount < 50 || buyInAmount > room.bet) {
          socket.emit('error', `Buy-in must be from 50 to ${room.bet} coins`);
          return;
        }

        // Perform buy-in through economic service
        const buyInResult = await economyService.pokerBuyIn(socket.user.id, buyInAmount);
        
        if (!buyInResult.success) {
          socket.emit('error', buyInResult.reason);
          return;
        }
        // Integrate with poker game
        const game = GameManager.getGame(roomId);
        if (game && game.gameType === 'poker') {
          const gameResult = game.playerBuyIn(socket.user.id, buyInAmount);
          
          if (gameResult.success) {
            // Send updated state to all players
            game.players.forEach(gamePlayer => {
              const stateForPlayer = game.getStateForPlayer(gamePlayer.id);
              io.to(gamePlayer.id).emit('game_update', stateForPlayer);
            });
          } else {
            console.error(`[SOCKET] Buy-in failed: ${gameResult.error}`);
            // Return money if failed to enter game
            await economyService.pokerCashOut(socket.user.id, buyInAmount);
            socket.emit('error', gameResult.error || 'Не удалось войти в игру');
            return;
          }
        }

        // Отправляем обновленный баланс
        socket.emit('update_coins', buyInResult.newBalance);
        socket.emit('poker_buy_in_success', { 
          buyInAmount, 
          newBalance: buyInResult.newBalance 
        });

      } catch (error) {
        console.error(`[POKER] Ошибка buy-in:`, error);
        socket.emit('error', 'Ошибка обработки buy-in');
      }
    });

    // Обработчик для покерного rebuy
    socket.on('poker_rebuy', async (data) => {
      const { roomId, rebuyAmount } = data;
      
      try {
        const room = await GameRoom.findByPk(roomId);
        if (!room || room.gameType !== 'poker') {
          socket.emit('error', 'Rebuy доступен только в покерных комнатах');
          return;
        }

        const game = GameManager.getGame(roomId);
        if (!game) {
          socket.emit('error', 'Игра не найдена');
          return;
        }

        const player = game.players.find(p => p.id === socket.user.id);
        if (!player) {
          socket.emit('error', 'Игрок не найден в игре');
          return;
        }

        // Проверяем лимиты rebuy
        if (rebuyAmount < 50 || rebuyAmount > room.bet) {
          socket.emit('error', `Rebuy должен быть от 50 до ${room.bet} монет`);
          return;
        }

        // Выполняем rebuy через экономический сервис
        const rebuyResult = await economyService.pokerRebuy(socket.user.id, rebuyAmount);
        if (!rebuyResult.success) {
          socket.emit('error', rebuyResult.reason);
          return;
        }

        // Используем метод rebuy из игры
        const gameResult = game.playerRebuy(socket.user.id, rebuyAmount);
        if (!gameResult.success) {
          console.error(`[SOCKET] Rebuy failed: ${gameResult.error}`);
          // Возвращаем деньги если не удалось сделать rebuy
          await economyService.pokerCashOut(socket.user.id, rebuyAmount);
          socket.emit('error', gameResult.error || 'Не удалось сделать rebuy');
          return;
        }

        // Отправляем обновленное состояние всем игрокам
        game.players.forEach(gamePlayer => {
          const stateForPlayer = game.getStateForPlayer(gamePlayer.id);
          io.to(gamePlayer.id).emit('game_update', stateForPlayer);
        });

        // Отправляем обновленный баланс
        socket.emit('update_coins', rebuyResult.newBalance);
        socket.emit('poker_rebuy_success', { 
          rebuyAmount, 
          newStack: player.stack,
          newBalance: rebuyResult.newBalance 
        });
        
        // Проверяем, можно ли начать новую раздачу после rebuy
        if (game.status === 'waiting') {
          const playersWithMoney = game.players.filter(p => p.hasBoughtIn && p.stack > 0);
          
          if (playersWithMoney.length >= 2) {
            game.startNewHand();
            
            // Отправляем обновленное состояние всем игрокам
            game.players.forEach(gamePlayer => {
              const stateForPlayer = game.getStateForPlayer(gamePlayer.id);
              io.to(gamePlayer.id).emit('game_update', stateForPlayer);
            });
            
            // Отправляем событие о начале новой раздачи
            io.to(roomId).emit('new_hand_started', { 
              gameType: 'poker', 
              players: game.players.map(p => ({ id: p.id, name: p.name }))
            });
          }
        }
      } catch (error) {
        console.error(`[POKER] Ошибка rebuy:`, error);
        socket.emit('error', 'Ошибка обработки rebuy');
      }
    });

    // Обработчик для покерного cash-out при выходе
    socket.on('poker_cash_out', async (data) => {
      const { roomId } = data;
      
      try {
        const room = await GameRoom.findByPk(roomId);
        if (!room || room.gameType !== 'poker') {
          socket.emit('error', 'Cash-out доступен только в покерных комнатах');
          return;
        }

        const game = GameManager.getGame(roomId);
        if (!game) {
          socket.emit('error', 'Игра не найдена');
          return;
        }

        const player = game.players.find(p => p.id === socket.user.id);
        if (!player) {
          socket.emit('error', 'Игрок не найден в игре');
          return;
        }

        // Используем метод cash-out из игры
        const gameResult = game.playerCashOut(socket.user.id);
        if (gameResult.success) {
          const cashOutAmount = gameResult.cashOutAmount;
          
          if (cashOutAmount > 0) {
            // Возвращаем деньги через экономический сервис
            const cashOutResult = await economyService.pokerCashOut(socket.user.id, cashOutAmount);
            if (cashOutResult.success) {
              socket.emit('update_coins', cashOutResult.newBalance);
              socket.emit('poker_cash_out_success', { 
                cashOutAmount, 
                newBalance: cashOutResult.newBalance 
              });
            } else {
              console.error(`[SOCKET] Ошибка cash-out:`, cashOutResult.reason);
            }
          }
          
          // Отправляем обновленное состояние всем игрокам
          game.players.forEach(gamePlayer => {
            const stateForPlayer = game.getStateForPlayer(gamePlayer.id);
            io.to(gamePlayer.id).emit('game_update', stateForPlayer);
          });
          
        } else {
          console.error(`[SOCKET] Cash-out failed: ${gameResult.error}`);
          socket.emit('error', gameResult.error || 'Не удалось выйти из игры');
        }
      } catch (error) {
        console.error(`[POKER] Ошибка cash-out:`, error);
        socket.emit('error', 'Ошибка обработки cash-out');
      }
    });

    const handleLeaveOrDisconnect = async (roomId) => {
      if (!roomId || !userRooms.has(roomId)) return;
      
      const game = GameManager.getGame(roomId);
      const room = await GameRoom.findByPk(roomId);

      await socket.leave(roomId);
      userRooms.delete(roomId);

      // Получаем оставшихся игроков перед обработкой экономики
      const remainingSockets = await io.in(roomId).fetchSockets();
      const remainingPlayerIds = remainingSockets.map(s => s.user.id);
      
      if (game && game.gameType === 'poker') {
        // Найдем игрока до удаления
        const playerThatLeft = game.players.find(p => p.id === socket.user.id);
        
        // Выполняем автоматический cash-out для покидающего игрока
        if (playerThatLeft && playerThatLeft.stack > 0) {
          const cashOutResult = await economyService.pokerCashOut(socket.user.id, playerThatLeft.stack);
          if (cashOutResult.success) {
            socket.emit('update_coins', cashOutResult.newBalance);
            }
        }
        
        // Вызываем handlePlayerLeave только если метод существует (старые игры)
        if (typeof game.handlePlayerLeave === 'function') {
          game.handlePlayerLeave(socket.user.id);
        }
        game.removePlayer(socket.user.id);

        // Отправляем обновленное состояние
        if (typeof game.getStateForPlayer === 'function') {
          game.players.forEach(player => {
              const stateForPlayer = game.getStateForPlayer(player.id);
              io.to(player.id).emit('game_update', stateForPlayer);
          });
        } else {
          // Для игр без персонализированного состояния
          const gameState = game.getState();
          io.to(roomId).emit('game_update', gameState);
        }

        if (game.players.length < 2) {
            // Выполняем cash-out для всех оставшихся игроков
            for (const remainingPlayer of game.players) {
              if (remainingPlayer.stack > 0) {
                const cashOutResult = await economyService.pokerCashOut(remainingPlayer.id, remainingPlayer.stack);
                if (cashOutResult.success) {
                  io.to(remainingPlayer.id).emit('update_coins', cashOutResult.newBalance);
                  }
              }
            }
            
            GameManager.removeGame(roomId);
            
            // Удаляем пустую комнату из базы данных
            try {
              await room.destroy();
              } catch (error) {
              console.error(`[SERVER] Error deleting poker room ${roomId}:`, error);
            }
            
            io.emit('room_list_updated');
            return; 
        }
      } else if (room) {
        // Для стандартных игр используем новую экономическую систему
        const economyType = economyService.getEconomyType(room.gameType);
        
        if (economyType === 'standard') {
          if (room.status === 'waiting') {
            // Игра еще не началась - возвращаем ставку
            const refundResult = await economyService.refundPlayerBet(socket.user.id, room.bet);
            if (refundResult.success) {
              socket.emit('update_coins', refundResult.newBalance);
            }
          } else if (room.status === 'in_progress' && remainingPlayerIds.length >= 1) {
            // Игра началась - засчитываем поражение покинувшему игроку, победу остальным
            const leaveResult = await economyService.handlePlayerLeave(roomId, socket.user.id, remainingPlayerIds);
            
            if (leaveResult.success && leaveResult.results.gameStatus !== 'continues') {
              // Игра завершена, уведомляем всех игроков
              const results = leaveResult.results;
              Object.keys(results.playerResults || {}).forEach(playerId => {
                const playerResult = results.playerResults[playerId];
                io.to(playerId).emit('update_coins', playerResult.newBalance);
                
                if (playerResult.type === 'winner') {
                  io.to(playerId).emit('game_end', { 
                    status: 'finished', 
                    winner: playerId,
                    reason: 'opponent_left',
                    coinsWon: playerResult.coinsChange,
                    economyResults: results.playerResults
                  });
                }
              });
              
              GameManager.removeGame(roomId);
              io.emit('room_list_updated');
              return;
            }
          }
        }
      }
      
      stopQuizTimerUpdates(roomId);
      
      if (remainingSockets.length === 0) {
        GameManager.removeGame(roomId);
        
        // Удаляем пустую комнату из базы данных
        if (room) {
          try {
            await room.destroy();
            io.emit('room_list_updated');
          } catch (error) {
            console.error(`[SERVER] Error deleting room ${roomId}:`, error);
          }
        }
      } else {
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
              // Для стандартных игр логика уже обработана выше через economyService.handlePlayerLeave
              } else {
              // Для покера - оставляем игру в покое, игрок может вернуться
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

    // Lesson Events - Синхронизация уроков между партнерами
    socket.on('lesson:join-room', (data) => {
      const { relationshipId } = data;
      if (relationshipId) {
        const roomName = `lesson:${relationshipId}`;
        socket.join(roomName);
        socket.lessonRoom = roomName;
        }
    });

    socket.on('lesson:completed', (data) => {
      const { lessonId, relationshipId, progress } = data;
      if (socket.lessonRoom) {
        // Уведомляем партнера о выполнении урока
        socket.to(socket.lessonRoom).emit('lesson:partner-completed', {
          lessonId,
          userId: socket.user.id,
          userName: socket.user.first_name,
          progress,
          timestamp: new Date().toISOString()
        });
        }
    });

    socket.on('lesson:progress-updated', (data) => {
      if (socket.lessonRoom) {
        // Синхронизируем обновление прогресса
        socket.to(socket.lessonRoom).emit('lesson:progress-sync', {
          userId: socket.user.id,
          progress: data.progress,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('lesson:start-together', (data) => {
      const { lessonId } = data;
      if (socket.lessonRoom) {
        // Уведомляем партнера о начале совместного урока
        socket.to(socket.lessonRoom).emit('lesson:partner-started', {
          lessonId,
          userId: socket.user.id,
          userName: socket.user.first_name,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('disconnect', () => {
      // User disconnected
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
    // Проверяем, что игра не была очищена
    if (game.isCleanedUp || game.status !== 'in_progress') {
      stopQuizTimerUpdates(roomId);
      return;
    }
    
    try {
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
    } catch (error) {
      console.error(`[QUIZ] Error in timer update for room ${roomId}:`, error);
      stopQuizTimerUpdates(roomId);
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
  
  // Используем новую экономическую систему
  const room = await GameRoom.findByPk(roomId);
  if (room && economyService.getEconomyType(room.gameType) === 'standard') {
    const isDraw = game.winner === 'draw' || !game.winner;
    const winnerId = isDraw ? null : game.winner;
    const playerIds = game.players;
    
    const economyResult = await economyService.finalizeStandardGame(roomId, winnerId, playerIds, isDraw);
    if (economyResult.success) {
      // Создаем расширенное состояние игры с информацией о монетах
      const enhancedGameState = {
        ...finalState,
        economyResults: economyResult.results.playerResults
      };
      
      // Отправляем game_end с информацией о монетах
      io.to(roomId).emit('game_end', enhancedGameState);
      
      // Отправляем обновленные балансы всем игрокам
      Object.keys(economyResult.results.playerResults || {}).forEach(playerId => {
        const playerResult = economyResult.results.playerResults[playerId];
        io.to(playerId).emit('update_coins', playerResult.newBalance);
      });
    } else {
      // Если экономическая система не сработала, отправляем обычное состояние
      io.to(roomId).emit('game_end', finalState);
    }
  } else {
    // Fallback для старой системы
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
  }
  
  GameManager.removeGame(roomId);
}

module.exports = { initSocket };