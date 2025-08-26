import React, { useEffect, useState } from 'react';
import { GameSettingsProps } from './types';
import styles from './BaseSettings.module.css';

const MemorySettings: React.FC<GameSettingsProps> = ({
  onSettingsChange,
  initialSettings
}) => {
  const [maxPlayers, setMaxPlayers] = useState(initialSettings.maxPlayers || 2);
  const [fieldSize, setFieldSize] = useState(initialSettings.fieldSize || '4x4');
  const [difficulty, setDifficulty] = useState(initialSettings.difficulty || 'medium');

  useEffect(() => {
    onSettingsChange({
      maxPlayers,
      fieldSize,
      difficulty,
      gameFormat: 'memory'
    });
  }, [maxPlayers, fieldSize, difficulty, onSettingsChange]);

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case 'easy': return '🟢 Легко';
      case 'medium': return '🟡 Средне';
      case 'hard': return '🔴 Сложно';
      default: return '🟡 Средне';
    }
  };

  return (
    <div>
      <div className={styles.field}>
        <label className={styles.label}>Количество игроков</label>
        <div className={styles.radioGroup}>
          {[2, 3, 4].map(count => (
            <div key={count} className={styles.radioOption}>
              <input
                type="radio"
                id={`memory-${count}`}
                name="maxPlayers"
                value={count}
                checked={maxPlayers === count}
                onChange={e => setMaxPlayers(Number(e.target.value))}
                className={styles.radioInput}
              />
              <label htmlFor={`memory-${count}`} className={styles.radioLabel}>
                {count}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Размер поля</label>
        <select
          value={fieldSize}
          onChange={e => setFieldSize(e.target.value)}
          className={styles.select}
        >
          <option value="4x4">4×4 (16 карт)</option>
          <option value="6x6">6×6 (36 карт)</option>
          <option value="8x8">8×8 (64 карты)</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Сложность</label>
        <div className={styles.radioGroup}>
          {['easy', 'medium', 'hard'].map(diff => (
            <div key={diff} className={styles.radioOption}>
              <input
                type="radio"
                id={`difficulty-${diff}`}
                name="difficulty"
                value={diff}
                checked={difficulty === diff}
                onChange={e => setDifficulty(e.target.value)}
                className={styles.radioInput}
              />
              <label htmlFor={`difficulty-${diff}`} className={styles.radioLabel}>
                {getDifficultyLabel(diff)}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.playersInfo}>
        <span className={styles.playersIcon}>🧩</span>
        <span className={styles.playersText}>{maxPlayers} игроков • Тренировка памяти</span>
      </div>

      <div className={styles.infoText}>
        Найдите все пары карт быстрее соперников
      </div>
    </div>
  );
};

export default MemorySettings;
