import React from 'react';
import PropTypes from 'prop-types';
import styles from './WaitingDisplay.module.css';

const WaitingDisplay = ({ status, message, playerCount }) => {
    let icon = '⏳';
    let mainText = 'Загрузка...';
    let subText = null;

    const isWaitingForPlayers = status === 'waiting_for_players' || (playerCount < 2 && status !== 'finished');

    if (status === 'waiting_for_next_hand') {
        icon = '🃏';
        mainText = message || 'Дождитесь завершения текущей раздачи...';
        subText = 'Вы присоединитесь к игре в следующей раздаче';
    } else if (isWaitingForPlayers) {
        icon = '👥';
        mainText = 'Ожидание других игроков...';
        subText = 'Минимум 2 игрока для начала раздачи';
    } else if (status === 'waiting' || !status) {
        icon = '⏳';
        mainText = message || 'Ожидание второго игрока...';
    }

    return (
        <div className={styles.waitingContainer}>
            <div className={styles.waitingMessage}>
                <div className={styles.waitingIcon}>{icon}</div>
                <div className={styles.waitingText}>{mainText}</div>
                {subText && <div className={styles.waitingSubtext}>{subText}</div>}
            </div>
        </div>
    );
};

WaitingDisplay.propTypes = {
    status: PropTypes.string,
    message: PropTypes.string,
    playerCount: PropTypes.number,
};

export default WaitingDisplay;