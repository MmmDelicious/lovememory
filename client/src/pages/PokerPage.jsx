import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import PokerTable from '../components/PokerGame/PokerTable';
import styles from './PokerPage.module.css';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const PokerPage = () => {
    const { roomId } = useParams();
    const { token, user } = useAuth();
    const { setCoins } = useCurrency();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log('Socket connected, joining room:', roomId);
            newSocket.emit('join_room', roomId);
        });

        newSocket.emit('get_game_state', roomId);

        newSocket.on('game_update', (newState) => {
            console.log("Game state updated: ", newState);
            console.log("Received poker state details:", {
                status: newState?.status,
                stage: newState?.stage,
                playersCount: newState?.players?.length,
                pot: newState?.pot,
                currentPlayerId: newState?.currentPlayerId,
                allowedActions: newState?.allowedActions,
                yourHand: newState?.yourHand?.length,
                communityCards: newState?.communityCards?.length,
                canMakeAction: newState?.canMakeAction
            });
            setGameState(prevState => {
                if (newState.status === 'waiting' || newState.stage === 'waiting') {
                    return {
                        ...newState,
                        players: newState.players || [],
                        communityCards: [],
                        pot: 0
                    };
                }
                
                if (newState.status === 'finished') {
                    const mergedState = { ...prevState, ...newState };

                    return mergedState;
                } else {
                    const activePlayers = newState.players?.filter(p => p.inHand) || [];
                    if (activePlayers.length < 2) {
                        return newState;
                    }
                    return newState;
                }
            });
        });

        newSocket.on('game_end', (finalState) => {
            setGameState(finalState);
        });
        
        newSocket.on('rebuy_success', (data) => {
            console.log('Rebuy successful:', data);
            alert(`Докупка успешна! Новый стек: ${data.newStack} фишек`);
            // Обновляем монеты через контекст (они обновятся автоматически через update_coins)
        });
        
        newSocket.on('update_coins', (newCoinsAmount) => {
            // Обновляем баланс монет через CurrencyContext
            setCoins(newCoinsAmount);
        });
        
        newSocket.on('error', (error) => {
            console.error("Socket Error:", error);
            alert(`Ошибка: ${error}`);
        });

        setSocket(newSocket);
        
        // Сохраняем socket и roomId глобально для использования в PokerTable
        window.pokerSocket = newSocket;
        window.pokerRoomId = roomId;

        return () => {
            console.log('Disconnecting socket...');
            delete window.pokerSocket;
            delete window.pokerRoomId;
            newSocket.disconnect();
        };
    }, [roomId, token, user.id]);

    const handleAction = (action, value = 0) => {
        if (!socket) {
            return;
        }
        
        if (!gameState) {
            return;
        }
        
        if (gameState.status !== 'in_progress') {
            return;
        }
        
        if (gameState.currentPlayerId !== user.id) {
            return;
        }
        
        console.log(`Sending action: ${action}, value: ${value}`);
        socket.emit('make_move', {
            roomId,
            move: { action, value }
        });
    };

    const handleExit = () => {
        if (socket) {
            socket.emit('leave_room', roomId);
            socket.disconnect();
        }
        navigate('/games');
    };
    
    if (!gameState) {
        return (
            <div className={styles.pokerApp}>
                <header className={styles.appHeader}>
                    <h1 className={styles.appTitle}>WORLD POKER CLUB</h1>
                    <button className={styles.leaveButton} onClick={handleExit}>
                        LEAVE
                    </button>
                </header>
                <main className={styles.gameBoard}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        fontSize: '2rem',
                        color: '#FFD700',
                        textAlign: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎰</div>
                            <div>Загрузка покерного стола...</div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.pokerApp}>
            <header className={styles.appHeader}>
                <h1 className={styles.appTitle}>WORLD POKER CLUB</h1>
                <button className={styles.leaveButton} onClick={handleExit}>
                    LEAVE
                </button>
            </header>
            <main className={styles.gameBoard}>
                <PokerTable 
                    gameState={gameState}
                    onAction={handleAction} 
                    userId={user.id}
                />
            </main>
        </div>
    );
};

export default PokerPage; 