import React, { useEffect, useState } from 'react';
import { GameSettingsProps } from './types';
import styles from './BaseSettings.module.css';

const QuizSettings: React.FC<GameSettingsProps> = ({
  onSettingsChange,
  initialSettings
}) => {
  const [gameFormat, setGameFormat] = useState(initialSettings.gameFormat || '1v1');
  const [category, setCategory] = useState(initialSettings.category || 'general');
  const [questionCount, setQuestionCount] = useState(initialSettings.questionCount || '15');
  const [isPrivate, setIsPrivate] = useState(initialSettings.isPrivate || false);

  const maxPlayers = gameFormat === '2v2' ? 4 : 2;

  useEffect(() => {
    onSettingsChange({
      maxPlayers,
      gameFormat,
      category,
      questionCount,
      isPrivate
    });
  }, [maxPlayers, gameFormat, category, questionCount, isPrivate, onSettingsChange]);

  return (
    <div>
      <div className={styles.field}>
        <label className={styles.label}>Формат игры</label>
        <div className={styles.radioGroup}>
          <div className={styles.radioOption}>
            <input
              type="radio"
              id="quiz-1v1"
              name="gameFormat"
              value="1v1"
              checked={gameFormat === '1v1'}
              onChange={e => setGameFormat(e.target.value)}
              className={styles.radioInput}
            />
            <label htmlFor="quiz-1v1" className={styles.radioLabel}>
              🎯 1 против 1
            </label>
          </div>
          <div className={styles.radioOption}>
            <input
              type="radio"
              id="quiz-2v2"
              name="gameFormat"
              value="2v2"
              checked={gameFormat === '2v2'}
              onChange={e => setGameFormat(e.target.value)}
              className={styles.radioInput}
            />
            <label htmlFor="quiz-2v2" className={styles.radioLabel}>
              ⚔️ Команды 2×2
            </label>
          </div>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Категория вопросов</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className={styles.select}
        >
          <option value="general">Общие знания</option>
          <option value="science">Наука</option>
          <option value="history">История</option>
          <option value="sports">Спорт</option>
          <option value="entertainment">Развлечения</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Количество вопросов</label>
        <select
          value={questionCount}
          onChange={e => setQuestionCount(e.target.value)}
          className={styles.select}
        >
          <option value="10">10 вопросов</option>
          <option value="15">15 вопросов</option>
          <option value="20">20 вопросов</option>
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
        <span className={styles.playersIcon}>🧠</span>
        <span className={styles.playersText}>
          {gameFormat === '2v2' ? '4 игрока • Команды 2×2' : '2 игрока • 1 против 1'}
        </span>
      </div>

      {gameFormat === '2v2' && (
        <div className={styles.warningText}>
          В командном формате выигравшая команда делит приз поровну
        </div>
      )}
    </div>
  );
};

export default QuizSettings;
