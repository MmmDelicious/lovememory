import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePokerGame } from '../../hooks/usePokerGame';
import PokerTable from '../../components/PokerGame/PokerTable';
import styles from './PokerPage.module.css';

const PokerPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { 
        gameState, 
        userId, 
        isObserving, 
        isConnected,
        connectionError,
        handleAction, 
        handleRebuy, 
        handleExit 
    } = usePokerGame(roomId);

    return (
        <div className={styles.pokerApp}>
            <header className={styles.appHeader}>
                <h1 className={styles.appTitle}>WORLD POKER CLUB</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {!isConnected && (
                        <div style={{ 
                            color: '#ff6b6b', 
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <div style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                backgroundColor: '#ff6b6b' 
                            }}></div>
                            Отключено
                        </div>
                    )}
                    {isConnected && (
                        <div style={{ 
                            color: '#51cf66', 
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <div style={{ 
                                width: '8px', 
                                height: '8px', 
                                borderRadius: '50%', 
                                backgroundColor: '#51cf66' 
                            }}></div>
                            Подключено
                        </div>
                    )}
                    <button className={styles.leaveButton} onClick={handleExit}>
                        LEAVE
                    </button>
                </div>
            </header>
            <main className={styles.gameBoard}>
                {connectionError && (
                    <div style={{
                        position: 'fixed',
                        top: '80px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#ff6b6b',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        zIndex: 1000,
                        fontSize: '0.9rem'
                    }}>
                        {connectionError}
                    </div>
                )}
                <PokerTable 
                    gameState={gameState}
                    onAction={handleAction} 
                    onRebuy={handleRebuy}
                    userId={userId}
                    isObserving={isObserving}
                />
            </main>
        </div>
    );
};

export default PokerPage;