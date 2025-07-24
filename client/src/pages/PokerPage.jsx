import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import PokerTable from '../components/PokerGame/PokerTable';
import styles from './PokerPage.module.css';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const PokerPage = () => {
    const { roomId } = useParams();
    const { token, user } = useAuth();
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
        
        newSocket.on('error', (error) => {
            console.error("Socket Error:", error);
            alert(`Ошибка: ${error}`);
        });

        setSocket(newSocket);

        return () => {
            console.log('Disconnecting socket...');
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
            <div className={styles.pokerPage}>
                <div className={styles.gameArea}>
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
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pokerPage}>
            <button className={styles.exitButton} onClick={handleExit} title="Выйти в игровой хаб">
                ←
            </button>
            <div className={styles.gameArea}>
                <PokerTable 
                    gameState={gameState}
                    onAction={handleAction} 
                    userId={user.id}
                />
            </div>
        </div>
    );
};

export default PokerPage; 