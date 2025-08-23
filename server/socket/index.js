const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const { GameRoom, User } = require('../models');
const gameService = require('../services/game.service');
const economyService = require('../services/economy.service');
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
            if (!room) {
                socket.emit('error', 'Комната не найдена.');
                return;
            }

            const allSocketsInRoom = await io.in(roomId).fetchSockets();
            const isRoomFull = allSocketsInRoom.length >= room.maxPlayers;

            if (isRoomFull) {
                socket.emit('error', 'Комната уже заполнена.');
                return;
            }

            // Для стандартных игр (не покер) резервируем ставку при входе
            const economyType = economyService.getEconomyType(room.gameType);
            if (economyType === 'standard' && room.status === 'waiting') {
                const betResult = await economyService.reservePlayerBet(socket.user.id, roomId, room.bet);
                if (!betResult.success) {
                    socket.emit('error', betResult.reason);
                    return;
                }
                // Отправляем обновленный баланс клиенту
                socket.emit('update_coins', betResult.newBalance);
            }

            await socket.join(roomId);
            userRooms.add(roomId);
            
            // Отправляем информацию о комнате клиенту
            socket.emit('room_info', {
                id: room.id,
                gameType: room.gameType,
                status: room.status,
                bet: room.bet,
                maxPlayers: room.maxPlayers
            });
            
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

            io.to(roomId).emit('player_list_update', playerInfo);

            if (room.status === 'waiting') {
                // Для покера создаем игру объект, но не меняем статус комнаты на in_progress
                // Для остальных игр ждем нужное количество игроков и сразу запускаем
                let requiredPlayers = 2;
                if (room.gameType === 'poker') {
                  requiredPlayers = 1;
                } else if (room.gameType === 'codenames') {
                  requiredPlayers = 4; // Codenames требует ровно 4 игрока (2v2)
                } else if ((room.gameType === 'wordle' || room.gameType === 'quiz') && room.maxPlayers === 4) {
                  requiredPlayers = 4; // Формат 2x2
                }
                
                const shouldCreateGame = currentSockets.length >= requiredPlayers;
                
                if (shouldCreateGame) {
                    // Для покера НЕ меняем статус комнаты - оставляем waiting
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
                            // Для покера передаем лимит как buyInCoins для расчета блайндов, для остальных игр передаем ставку
                            ...(gameType === 'poker' ? { buyInCoins: room.bet } : { buyInCoins: room.bet })
                        };
                    });
                    
                    // Подготавливаем опции игры
                    const gameOptions = {
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
                      },
                      onGameStart: gameType === 'poker' ? async () => {
                        // Меняем статус покерной комнаты на in_progress когда игра начинается
                        try {
                          await gameService.startGame(roomId);
                          io.emit('room_list_updated');
                        } catch (error) {
                          // Silent error handling
                        }
                      } : undefined,
                      gameFormat: room.gameFormat || '1v1'
                    };

                    // Добавляем специфичные настройки игры
                    if (room.gameSettings) {
                      Object.assign(gameOptions, room.gameSettings);
                    }

                    const game = GameManager.createGame(roomId, gameType, playerInfo, gameOptions);
                    io.to(roomId).emit('game_start', { gameType, players: playerInfo, maxPlayers: room.maxPlayers });

                    // Для покера нужно добавить всех игроков, которые еще не в игре
                    if (game.gameType === 'poker') {
                        // Добавляем новых игроков в покер
                        currentSockets.forEach(socket => {
                            const existingPlayer = game.players.find(p => p.id === socket.user.id);
                            if (!existingPlayer) {
                                const user = usersMap.get(socket.user.id);
                                const newPlayerInfo = {
                                    id: socket.user.id,
                                    name: user ? (user.first_name || user.email.split('@')[0]) : socket.user.email.split('@')[0],
                                    gender: user ? user.gender : 'male'
                                };
                                game.addPlayer(newPlayerInfo);
                            }
                        });

                        game.players.forEach(player => {
                            const stateForPlayer = game.getStateForPlayer(player.id);
                            io.to(player.id).emit('game_update', stateForPlayer);
                        });
                    } else if (game.gameType === 'wordle') {
                        game.players.forEach(player => {
                            const stateForPlayer = game.getStateForPlayer(player.id);
                            io.to(player.id).emit('game_update', stateForPlayer);
                        });
                    } else if (game.gameType === 'codenames') {
                        // Для Codenames отправляем разные состояния капитанам и игрокам
                        game.players.forEach(playerId => {
                            const playerRole = game.getPlayerRole(playerId);
                            let stateForPlayer;
                            if (playerRole && playerRole.role === 'captain') {
                                stateForPlayer = game.getCaptainState(playerId);
                            } else {
                                stateForPlayer = game.getState();
                            }
                            io.to(playerId).emit('game_update', stateForPlayer);
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
                const game = GameManager.getGame(roomId);
                if (game && game.gameType === 'poker') {
                    const user = await User.findByPk(socket.user.id, { attributes: ['id', 'email', 'gender', 'first_name'] });
                    const newPlayerInfo = {
                        id: socket.user.id,
                        name: user ? (user.first_name || user.email.split('@')[0]) : socket.user.email.split('@')[0],
                        gender: user ? user.gender : 'male'
                    };
                    
                    // Проверяем, есть ли уже такой игрок в игре
                    const existingPlayer = game.players.find(p => p.id === socket.user.id);
                    if (existingPlayer) {
                        // Игрок переподключается
                    } else {
                        // Новый игрок присоединяется как наблюдатель (без buy-in)
                        game.addPlayer(newPlayerInfo);
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
      const game = GameManager.getGame(roomId);
      if (!game) {
        return;
      }
      
      try {
        const gameType = game.gameType;
        
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
        } else if (gameType === 'codenames') {
          // Для Codenames отправляем разные состояния капитанам и игрокам
          // Используем актуальное состояние после хода
          game.players.forEach(playerId => {
            const playerRole = game.getPlayerRole(playerId);
            let stateForPlayer;
            if (playerRole && playerRole.role === 'captain') {
              stateForPlayer = game.getCaptainState(playerId);
            } else {
              stateForPlayer = game.getState();
            }
            io.to(playerId).emit('game_update', stateForPlayer);
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
              
              if (!currentGame) {
                return;
              }
              
              // Проверяем всех игроков, которые сделали buy-in (независимо от текущего стека)
              const activePlayers = currentGame.players.filter(p => p.hasBoughtIn);
              const playersWithMoney = activePlayers.filter(p => p.stack > 0);
              
              // Если есть хотя бы 2 активных игрока (независимо от стека), продолжаем игру
              if (activePlayers.length >= 2) {
                // Если есть игроки с деньгами, начинаем новую раздачу
                if (playersWithMoney.length >= 2) {
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
                } else {
                  // Если игроков с деньгами меньше 2, но есть активные игроки - ждем rebuy
                  currentGame.status = 'waiting'; // Переводим игру в режим ожидания rebuy
                  
                  // Отправляем состояние всем игрокам
                  currentGame.players.forEach(player => {
                    const stateForPlayer = currentGame.getStateForPlayer(player.id);
                    io.to(player.id).emit('game_update', stateForPlayer);
                  });
                  
                  // Уведомляем игроков о возможности rebuy
                  io.to(roomId).emit('rebuy_opportunity', {
                    message: 'Игроки могут сделать rebuy для продолжения игры'
                  });
                }
              } else {
                // Если активных игроков меньше 2, завершаем сессию
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
            }, 4000); // 4 секунды для просмотра результатов раздачи
          } else {
            const finalState = game.getState();
            
            // Используем новую экономическую систему для завершения игры
            const room = await GameRoom.findByPk(roomId);
            if (room && economyService.getEconomyType(room.gameType) === 'standard') {
              const isDraw = finalState.winner === 'draw' || finalState.isDraw;
              const winnerId = isDraw ? null : finalState.winner;
              const playerIds = game.players.map(p => p.id || p);
              
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
                io.emit('room_list_updated');
              } else {
                // Если экономическая система не сработала, отправляем обычное состояние
                io.to(roomId).emit('game_end', finalState);
              }
            } else {
              // Fallback для старой системы (если нужно)
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

      } catch (error) {
        console.error(`[SERVER] [ERROR] in 'rebuy':`, error.message);
        socket.emit('error', error.message);
      }
    });

    // Новый обработчик для покерного buy-in
    socket.on('poker_buy_in', async (data) => {
      const { roomId, buyInAmount } = data;
      
      try {
        const room = await GameRoom.findByPk(roomId);
        if (!room || room.gameType !== 'poker') {
          socket.emit('error', 'Покерный buy-in доступен только в покерных комнатах');
          return;
        }

        // Проверяем лимиты
        if (buyInAmount < 50 || buyInAmount > room.bet) {
          socket.emit('error', `Buy-in должен быть от 50 до ${room.bet} монет`);
          return;
        }

        // Выполняем buy-in через экономический сервис
        const buyInResult = await economyService.pokerBuyIn(socket.user.id, buyInAmount);
        if (!buyInResult.success) {
          socket.emit('error', buyInResult.reason);
          return;
        }

        // Интегрируем с покерной игрой
        const game = GameManager.getGame(roomId);
        if (game && game.gameType === 'poker') {
          const success = game.playerBuyIn(socket.user.id, buyInAmount);
          if (success) {
            // Отправляем обновленное состояние всем игрокам
            game.players.forEach(gamePlayer => {
              const stateForPlayer = game.getStateForPlayer(gamePlayer.id);
              io.to(gamePlayer.id).emit('game_update', stateForPlayer);
            });
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

        // Добавляем деньги к стеку игрока
        player.stack += rebuyAmount;

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

        const cashOutAmount = player.stack;
        
        if (cashOutAmount > 0) {
          // Выполняем cash-out через экономический сервис
          const cashOutResult = await economyService.pokerCashOut(socket.user.id, cashOutAmount);
          if (cashOutResult.success) {
            socket.emit('update_coins', cashOutResult.newBalance);
            socket.emit('poker_cash_out_success', { 
              cashOutAmount, 
              newBalance: cashOutResult.newBalance 
            });
          } else {
            console.error(`[POKER] Ошибка cash-out:`, cashOutResult.reason);
          }
        }
      } catch (error) {
        console.error(`[POKER] Ошибка cash-out:`, error);
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
        console.log(`[SERVER] Poker game detected for room ${roomId}`);
        
        // Найдем игрока до удаления
        const playerThatLeft = game.players.find(p => p.id === socket.user.id);
        
        // Выполняем автоматический cash-out для покидающего игрока
        if (playerThatLeft && playerThatLeft.stack > 0) {
          const cashOutResult = await economyService.pokerCashOut(socket.user.id, playerThatLeft.stack);
          if (cashOutResult.success) {
            socket.emit('update_coins', cashOutResult.newBalance);
            console.log(`[POKER] Auto cash-out ${playerThatLeft.stack} монет для игрока ${socket.user.id}`);
          }
        }
        
        game.handlePlayerLeave(socket.user.id);
        game.removePlayer(socket.user.id);

        game.players.forEach(player => {
            const stateForPlayer = game.getStateForPlayer(player.id);
            io.to(player.id).emit('game_update', stateForPlayer);
        });

        if (game.players.length < 2) {
            console.log(`[SERVER] Less than 2 players left in poker game. Finalizing session.`);
            
            // Выполняем cash-out для всех оставшихся игроков
            for (const remainingPlayer of game.players) {
              if (remainingPlayer.stack > 0) {
                const cashOutResult = await economyService.pokerCashOut(remainingPlayer.id, remainingPlayer.stack);
                if (cashOutResult.success) {
                  io.to(remainingPlayer.id).emit('update_coins', cashOutResult.newBalance);
                  console.log(`[POKER] Auto cash-out ${remainingPlayer.stack} монет для игрока ${remainingPlayer.id}`);
                }
              }
            }
            
            GameManager.removeGame(roomId);
            
            // Удаляем пустую комнату из базы данных
            try {
              await room.destroy();
              console.log(`[SERVER] Deleted empty poker room ${roomId} from database`);
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
            console.log(`[SERVER] Игра ${roomId} еще не началась, возвращаем ставку игроку ${socket.user.id}`);
            const refundResult = await economyService.refundPlayerBet(socket.user.id, room.bet);
            if (refundResult.success) {
              socket.emit('update_coins', refundResult.newBalance);
            }
          } else if (room.status === 'in_progress' && remainingPlayerIds.length >= 1) {
            // Игра началась - засчитываем поражение покинувшему игроку, победу остальным
            console.log(`[SERVER] Игрок ${socket.user.id} покинул начавшуюся игру ${roomId}, засчитываем поражение`);
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
      
      console.log(`[SERVER] Room ${roomId} has ${remainingSockets.length} remaining sockets after user ${socket.user.id} left`);
      
      if (remainingSockets.length === 0) {
        console.log(`[SERVER] Room ${roomId} is empty, deleting it`);
        GameManager.removeGame(roomId);
        
        // Удаляем пустую комнату из базы данных
        if (room) {
          try {
            await room.destroy();
            console.log(`[SERVER] Deleted empty room ${roomId} from database`);
            io.emit('room_list_updated');
          } catch (error) {
            console.error(`[SERVER] Error deleting room ${roomId}:`, error);
          }
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
              // Для стандартных игр логика уже обработана выше через economyService.handlePlayerLeave
              console.log(`[SERVER] Non-poker game with less than 2 players - handled by economy service`);
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

    // Lesson Events - Синхронизация уроков между партнерами
    socket.on('lesson:join-room', (data) => {
      const { relationshipId } = data;
      if (relationshipId) {
        const roomName = `lesson:${relationshipId}`;
        socket.join(roomName);
        socket.lessonRoom = roomName;
        console.log(`[SOCKET] User ${socket.user.id} joined lesson room: ${roomName}`);
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
        console.log(`[SOCKET] Lesson ${lessonId} completed by user ${socket.user.id} in room ${socket.lessonRoom}`);
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