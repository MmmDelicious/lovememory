import React, { useEffect, useState } from 'react';
import { GameSettingsProps } from './types';
import styles from './BaseSettings.module.css';

const WordleSettings: React.FC<GameSettingsProps> = ({
  onSettingsChange,
  initialSettings
}) => {
  const [gameFormat, setGameFormat] = useState(initialSettings.gameFormat || '1v1');
  const [language, setLanguage] = useState(initialSettings.language || 'russian');
  const [roundCount, setRoundCount] = useState(initialSettings.roundCount || '3');

  const maxPlayers = gameFormat === '2v2' ? 4 : 2;

  useEffect(() => {
    onSettingsChange({
      maxPlayers,
      gameFormat,
      language,
      roundCount
    });
  }, [maxPlayers, gameFormat, language, roundCount]);

  return (
    <div>
      <div className={styles.field}>
        <label className={styles.label}>Формат игры</label>
        <div className={styles.radioGroup}>
          <div className={styles.radioOption}>
            <input
              type="radio"
              id="wordle-1v1"
              name="gameFormat"
              value="1v1"
              checked={gameFormat === '1v1'}
              onChange={e => setGameFormat(e.target.value)}
              className={styles.radioInput}
            />
            <label htmlFor="wordle-1v1" className={styles.radioLabel}>
              🎯 1 против 1
            </label>
          </div>
          <div className={styles.radioOption}>
            <input
              type="radio"
              id="wordle-2v2"
              name="gameFormat"
              value="2v2"
              checked={gameFormat === '2v2'}
              onChange={e => setGameFormat(e.target.value)}
              className={styles.radioInput}
            />
            <label htmlFor="wordle-2v2" className={styles.radioLabel}>
              ⚔️ Команды 2×2
            </label>
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Язык словаря</label>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className={styles.select}
        >
          <option value="russian">🇷🇺 Русский</option>
          <option value="english">🇺🇸 English</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Количество раундов</label>
        <select
          value={roundCount}
          onChange={e => setRoundCount(e.target.value)}
          className={styles.select}
        >
          <option value="1">1 раунд</option>
          <option value="3">3 раунда</option>
          <option value="5">5 раундов</option>
        </select>
      </div>

      <div className={styles.playersInfo}>
        <span className={styles.playersIcon}>📝</span>
        <span className={styles.playersText}>
          {gameFormat === '2v2' ? '4 игрока • Команды 2×2' : '2 игрока • 1 против 1'}
        </span>
      </div>

      <div className={styles.infoText}>
        Угадайте слово за 6 попыток. Побеждает тот, кто справится быстрее
      </div>

      {gameFormat === '2v2' && (
        <div className={styles.warningText}>
          В командном формате выигравшая команда делит приз поровну
        </div>
      )}
    </div>
  );
};

export default WordleSettings;
