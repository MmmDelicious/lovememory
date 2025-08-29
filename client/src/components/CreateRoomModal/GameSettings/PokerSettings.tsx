import React, { useEffect, useState } from 'react';
import { GameSettingsProps } from './types';
import styles from './BaseSettings.module.css';

const PokerSettings: React.FC<GameSettingsProps> = ({
  onSettingsChange,
  initialSettings
}) => {
  const [maxPlayers, setMaxPlayers] = useState(initialSettings.maxPlayers || 4);
  const [pokerType, setPokerType] = useState(initialSettings.pokerType || 'texas');
  const [blindStructure, setBlindStructure] = useState(initialSettings.blindStructure || 'fixed');
  const [isPrivate, setIsPrivate] = useState(initialSettings.isPrivate || false);

  useEffect(() => {
    onSettingsChange({
      maxPlayers,
      pokerType,
      blindStructure,
      isPrivate,
      gameFormat: 'poker'
    });
  }, [maxPlayers, pokerType, blindStructure, isPrivate]);

  return (
    <div>
      <div className={styles.field}>
        <label className={styles.label}>Количество игроков</label>
        <div className={styles.radioGroup}>
          {[2, 3, 4, 5, 6].map(count => (
            <div key={count} className={styles.radioOption}>
              <input
                type="radio"
                id={`poker-${count}`}
                name="maxPlayers"
                value={count}
                checked={maxPlayers === count}
                onChange={e => setMaxPlayers(Number(e.target.value))}
                className={styles.radioInput}
              />
              <label htmlFor={`poker-${count}`} className={styles.radioLabel}>
                {count}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Тип покера</label>
        <select
          value={pokerType}
          onChange={e => setPokerType(e.target.value)}
          className={styles.select}
        >
          <option value="texas">Техасский Холдем</option>
          <option value="omaha">Омаха</option>
          <option value="stud">Стад покер</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Структура блайндов</label>
        <select
          value={blindStructure}
          onChange={e => setBlindStructure(e.target.value)}
          className={styles.select}
        >
          <option value="fixed">Фиксированные</option>
          <option value="increasing">Растущие</option>
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
        <span className={styles.playersIcon}>🃏</span>
        <span className={styles.playersText}>{maxPlayers} игроков • Карточная игра</span>
      </div>

      <div className={styles.warningText}>
        💰 В покере вы играете на свои монеты. Указанная сумма - максимальная ставка за стол
      </div>
    </div>
  );
};

export default PokerSettings;
