import React, { useEffect, useState } from 'react';
import { GameSettingsProps } from './types';
import styles from './BaseSettings.module.css';

const ChessSettings: React.FC<GameSettingsProps> = ({
  onSettingsChange,
  initialSettings
}) => {
  const [timeControl, setTimeControl] = useState(initialSettings.timeControl || 'rapid');
  const [isPrivate, setIsPrivate] = useState(initialSettings.isPrivate || false);

  useEffect(() => {
    onSettingsChange({
      maxPlayers: 2,
      timeControl,
      isPrivate,
      gameFormat: '1v1'
    });
  }, [timeControl, isPrivate, onSettingsChange]);

  return (
    <div>
      <div className={styles.field}>
        <label className={styles.label}>Контроль времени</label>
        <select
          value={timeControl}
          onChange={e => setTimeControl(e.target.value)}
          className={styles.select}
        >
          <option value="blitz">Блиц (5 мин)</option>
          <option value="rapid">Рапид (15 мин)</option>
          <option value="classical">Классика (30 мин)</option>
          <option value="unlimited">Без лимита</option>
        </select>
      </div>

      <div className={styles.field}>
        <div className={styles.toggle}>
          <span className={styles.toggleLabel}>Приватная игра</span>
          <div 
            className={`${styles.toggleSwitch} ${isPrivate ? styles.active : ''}`}
            onClick={() => setIsPrivate(!isPrivate)}
          >
            <div className={styles.toggleKnob}></div>
          </div>
        </div>
        <div className={styles.infoText}>
          Приватные игры доступны только по приглашению
        </div>
      </div>

      <div className={styles.playersInfo}>
        <span className={styles.playersIcon}>♚</span>
        <span className={styles.playersText}>2 игрока • Стратегическая битва</span>
      </div>
    </div>
  );
};

export default ChessSettings;
