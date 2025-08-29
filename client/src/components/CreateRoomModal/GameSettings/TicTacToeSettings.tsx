import React, { useEffect, useState } from 'react';
import { GameSettingsProps } from './types';
import styles from './BaseSettings.module.css';

const TicTacToeSettings: React.FC<GameSettingsProps> = ({
  onSettingsChange,
  initialSettings
}) => {
  const [timeLimit, setTimeLimit] = useState(initialSettings.timeLimit || '60');

  useEffect(() => {
    onSettingsChange({
      maxPlayers: 2,
      timeLimit,
      gameFormat: '1v1'
    });
  }, [timeLimit]);

  return (
    <div>
      <div className={styles.field}>
        <label className={styles.label}>Лимит времени на ход</label>
        <select
          value={timeLimit}
          onChange={e => setTimeLimit(e.target.value)}
          className={styles.select}
        >
          <option value="30">30 секунд</option>
          <option value="60">1 минута</option>
          <option value="120">2 минуты</option>
          <option value="unlimited">Без лимита</option>
        </select>
      </div>

      <div className={styles.playersInfo}>
        <span className={styles.playersIcon}>👥</span>
        <span className={styles.playersText}>2 игрока • 1 против 1</span>
      </div>
    </div>
  );
};

export default TicTacToeSettings;
