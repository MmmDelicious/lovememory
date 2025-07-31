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
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token || !user.id) return;

        const socket = io(SOCKET_URL, {
            auth: { token }
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to socket server');
            socket.emit('join_room', roomId);
        });
        
        socket.emit('get_game_state', roomId);
        console.log('Requested game state for room:', roomId);

        socket.on('player_list_update', (players) => {
            console.log('Player list updated:', players);
        });

        socket.on('game_update', (newState) => {
            console.log('Received game_update:', newState);
            
            if (newState.isObserving) {
                console.log("Player is observing.");
                setIsObserving(true);
            } else {
                setIsObserving(false);
            }

            setGameState(newState);
        });

        socket.on('game_start', (gameData) => {
            console.log('Game started:', gameData);
            socket.emit('get_game_state', roomId);
        });

        socket.on('game_end', (finalState) => {
            console.log('Game ended:', finalState);
            setGameState(finalState);
        });
        
        socket.on('rebuy_success', (data) => {
            alert(`Докупка успешна! Новый стек: ${data.newStack} фишек`);
        });
        
        socket.on('update_coins', (newCoinsAmount) => {
            setCoins(newCoinsAmount);
        });
        
        socket.on('error', (error) => {
            console.error("Socket Error:", error);
            alert(`Ошибка: ${error}`);
        });

        return () => {
            socket.emit('leave_room', roomId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [roomId, token, user.id, setCoins, navigate]);

    const handleAction = useCallback((action, value = 0) => {
        if (socketRef.current && gameState && gameState.currentPlayerId === user.id && !isObserving) {
            socketRef.current.emit('make_move', {
                roomId,
                move: { action, value }
            });
        }
    }, [roomId, user.id, gameState, isObserving]);

    const handleRebuy = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('rebuy', { roomId });
        }
    }, [roomId]);
    
    const handleExit = useCallback(() => {
        navigate('/games');
    }, [navigate]);

    return { gameState, userId: user.id, isObserving, handleAction, handleRebuy, handleExit };
};