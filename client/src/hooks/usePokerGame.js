import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const usePokerGame = (roomId) => {
    const { token, user } = useAuth();
    const { setCoins } = useCurrency();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState(null);
    const [isObserving, setIsObserving] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const previousGameStateRef = useRef(null); // Сохраняем предыдущее состояние

    const connectSocket = useCallback(() => {
        if (!token || !user.id) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to socket server');
            setIsConnected(true);
            setConnectionError(null);
            socket.emit('join_room', roomId);
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from socket server:', reason);
            setIsConnected(false);
            
            if (reason === 'io server disconnect') {
                // Сервер отключил соединение
                setConnectionError('Соединение с сервером потеряно. Попытка переподключения...');
            }
        });

        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            setIsConnected(false);
            setConnectionError('Ошибка подключения к серверу');
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            setIsConnected(true);
            setConnectionError(null);
            socket.emit('join_room', roomId);
            socket.emit('get_game_state', roomId);
        });

        socket.on('reconnect_failed', () => {
            console.error('Failed to reconnect');
            setConnectionError('Не удалось переподключиться к серверу');
        });
        
        socket.emit('get_game_state', roomId);
        console.log('Requested game state for room:', roomId);

        socket.on('player_list_update', (players) => {
            console.log('Player list updated:', players);
        });

        socket.on('game_update', (newState) => {
            console.log('Received game_update:', newState);
            
            // Валидация данных с сервера
            if (!newState || typeof newState !== 'object') {
                console.error('Invalid game state received:', newState);
                // Восстанавливаем предыдущее состояние, если оно есть
                if (previousGameStateRef.current) {
                    console.log('Restoring previous game state');
                    setGameState(previousGameStateRef.current);
                }
                return;
            }
            
            // Проверяем, что новое состояние содержит необходимые поля
            if (!newState.status && !newState.players) {
                console.error('Incomplete game state received:', newState);
                // Восстанавливаем предыдущее состояние, если оно есть
                if (previousGameStateRef.current) {
                    console.log('Restoring previous game state');
                    setGameState(previousGameStateRef.current);
                }
                return;
            }
            
            if (newState.isObserving) {
                console.log("Player is observing.");
                setIsObserving(true);
            } else {
                setIsObserving(false);
            }

            // Сохраняем предыдущее состояние перед обновлением
            previousGameStateRef.current = gameState;
            setGameState(newState);
        });

        socket.on('game_start', (gameData) => {
            console.log('Game started:', gameData);
            socket.emit('get_game_state', roomId);
        });

        socket.on('new_hand_started', (gameData) => {
            console.log('New hand started:', gameData);
            // НЕ сбрасываем состояние и НЕ запрашиваем новое сразу
            // Сервер сам отправит game_update с новым состоянием
        });

        socket.on('game_end', (finalState) => {
            console.log('Game ended:', finalState);
            setGameState(finalState);
        });
        
        socket.on('rebuy_success', (data) => {
            if (data && typeof data.newStack === 'number') {
                alert(`Докупка успешна! Новый стек: ${data.newStack} монет`);
            } else {
                alert('Докупка успешна!');
            }
        });
        
        socket.on('update_coins', (newCoinsAmount) => {
            if (typeof newCoinsAmount === 'number' && newCoinsAmount >= 0) {
                setCoins(newCoinsAmount);
            } else {
                console.error('Invalid coins amount received:', newCoinsAmount);
            }
        });
        
        socket.on('error', (error) => {
            console.error("Socket Error:", error);
            
            // Обработка различных типов ошибок
            if (typeof error === 'string') {
                if (error.includes('Authentication') || error.includes('Connection') || 
                    error.includes('Insufficient coins') || error.includes('Not your turn') ||
                    error.includes('Action is not allowed') || error.includes('Player not found')) {
                    alert(`Ошибка: ${error}`);
                } else if (error.includes('Game not found') || error.includes('Room not found')) {
                    alert('Игра не найдена. Перенаправление...');
                    navigate('/games');
                }
            } else {
                alert('Произошла неизвестная ошибка');
            }
        });

        return socket;
    }, [roomId, token, user.id, setCoins, navigate]);

    useEffect(() => {
        const socket = connectSocket();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socket) {
                socket.emit('leave_room', roomId);
                socket.disconnect();
                socketRef.current = null;
            }
        };
    }, [connectSocket, roomId]);

    const handleAction = useCallback((action, value = 0) => {
        if (!socketRef.current || !isConnected) {
            alert('Нет соединения с сервером');
            return;
        }

        if (!gameState) {
            alert('Состояние игры не загружено');
            return;
        }

        if (gameState.currentPlayerId !== user.id) {
            alert('Не ваш ход');
            return;
        }

        if (isObserving) {
            alert('Вы наблюдатель и не можете делать ходы');
            return;
        }

        // Валидация действия
        if (!gameState.validActions || !gameState.validActions.includes(action)) {
            alert(`Действие "${action}" не разрешено`);
            return;
        }

        // Валидация значения для рейза
        if (action === 'raise') {
            if (typeof value !== 'number' || value < 0) {
                alert('Некорректная сумма рейза');
                return;
            }
            
            const minRaise = gameState.minRaiseAmount || 0;
            const maxRaise = gameState.maxRaiseAmount || 0;
            
            if (value < minRaise || value > maxRaise) {
                alert(`Сумма рейза должна быть от ${minRaise} до ${maxRaise}`);
                return;
            }
        }

        try {
            socketRef.current.emit('make_move', {
                roomId,
                move: { action, value }
            });
        } catch (error) {
            console.error('Error sending move:', error);
            alert('Ошибка при отправке хода');
        }
    }, [roomId, user.id, gameState, isObserving, isConnected]);

    const handleRebuy = useCallback(() => {
        if (!socketRef.current || !isConnected) {
            alert('Нет соединения с сервером');
            return;
        }

        try {
            socketRef.current.emit('rebuy', { roomId });
        } catch (error) {
            console.error('Error sending rebuy request:', error);
            alert('Ошибка при запросе докупки');
        }
    }, [roomId, isConnected]);
    
    const handleExit = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('leave_room', roomId);
        }
        navigate('/games');
    }, [navigate, roomId]);

    return { 
        gameState, 
        userId: user.id, 
        isObserving, 
        isConnected,
        connectionError,
        handleAction, 
        handleRebuy, 
        handleExit 
    };
};