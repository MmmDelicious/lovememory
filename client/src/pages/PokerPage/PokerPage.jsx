import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePokerGame } from '../../hooks/usePokerGame';
import PokerTable from '../../components/PokerGame/PokerTable';
import styles from './PokerPage.module.css';

const PokerPage = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { gameState, userId, isObserving, handleAction, handleRebuy, handleExit } = usePokerGame(roomId);

    if (!gameState) {
        return (
            <div className={styles.pokerApp}>
                <header className={styles.appHeader}>
                    <h1 className={styles.appTitle}>WORLD POKER CLUB</h1>
                    <button className={styles.leaveButton} onClick={() => navigate('/games')}>
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
                    onRebuy={handleRebuy}
                    userId={userId}
                    isObserving={isObserving}
                />
            </main>
        </div>
    );
};

export default PokerPage;