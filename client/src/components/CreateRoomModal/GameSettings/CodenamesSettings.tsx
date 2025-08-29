import React, { useEffect, useState } from 'react';
import { GameSettingsProps } from './types';
import styles from './BaseSettings.module.css';

const CodenamesSettings: React.FC<GameSettingsProps> = ({
  onSettingsChange,
  initialSettings
}) => {
  const [wordDifficulty, setWordDifficulty] = useState(initialSettings.wordDifficulty || 'medium');
  const [teamDistribution, setTeamDistribution] = useState(initialSettings.teamDistribution || 'auto');
  const [isPrivate, setIsPrivate] = useState(initialSettings.isPrivate || false);

  useEffect(() => {
    onSettingsChange({
      maxPlayers: 4,
      gameFormat: '2v2',
      wordDifficulty,
      teamDistribution,
      isPrivate
    });
  }, [wordDifficulty, teamDistribution, isPrivate]);

  return (
    <div>
      <div className={styles.field}>
        <label className={styles.label}>Сложность слов</label>
        <div className={styles.radioGroup}>
          <div className={styles.radioOption}>
            <input
              type="radio"
              id="codenames-easy"
              name="wordDifficulty"
              value="easy"
              checked={wordDifficulty === 'easy'}
              onChange={e => setWordDifficulty(e.target.value)}
              className={styles.radioInput}
            />
            <label htmlFor="codenames-easy" className={styles.radioLabel}>
              😊 Простые
            </label>
          </div>
          <div className={styles.radioOption}>
            <input
              type="radio"
              id="codenames-medium"
              name="wordDifficulty"
              value="medium"
              checked={wordDifficulty === 'medium'}
              onChange={e => setWordDifficulty(e.target.value)}
              className={styles.radioInput}
            />
            <label htmlFor="codenames-medium" className={styles.radioLabel}>
              🤔 Средние
            </label>
          </div>
          <div className={styles.radioOption}>
            <input
              type="radio"
              id="codenames-hard"
              name="wordDifficulty"
              value="hard"
              checked={wordDifficulty === 'hard'}
              onChange={e => setWordDifficulty(e.target.value)}
              className={styles.radioInput}
            />
            <label htmlFor="codenames-hard" className={styles.radioLabel}>
              🔥 Сложные
            </label>
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Распределение команд</label>
        <select
          value={teamDistribution}
          onChange={e => setTeamDistribution(e.target.value)}
          className={styles.select}
        >
          <option value="auto">🎲 Автоматическое</option>
          <option value="manual">👥 Ручное</option>
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
      </div>

      <div className={styles.playersInfo}>
        <span className={styles.playersIcon}>🔤</span>
        <span className={styles.playersText}>4 игрока • Команды 2×2</span>
      </div>

      <div className={styles.infoText}>
        Игра всегда проходит в формате 2×2: капитаны дают подсказки, игроки отгадывают слова команды
      </div>

      <div className={styles.warningText}>
        Выигравшая команда делит приз поровну между участниками
      </div>
    </div>
  );
};

export default CodenamesSettings;
