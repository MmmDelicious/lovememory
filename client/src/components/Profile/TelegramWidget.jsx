import React, { useState, useEffect } from 'react';
import Button from '../Button/Button';
import styles from './Widget.module.css';
import { FaTelegramPlane } from 'react-icons/fa';

const TelegramWidget = ({ initialTelegramId, saveTelegramId }) => {
  const [telegramId, setTelegramId] = useState('');

  useEffect(() => {
    setTelegramId(initialTelegramId || '');
  }, [initialTelegramId]);

  const handleSave = (e) => {
    e.preventDefault();
    saveTelegramId(telegramId);
  };

  return (
    <div className={`${styles.widget} ${styles.telegramWidget}`}>
      <div className={styles.widgetIconWrapper}><FaTelegramPlane /></div>
      <div className={styles.widgetContent}>
        <h4 className={styles.widgetTitle}>Telegram</h4>
        <form className={styles.widgetBody} onSubmit={handleSave}>
          <p>Подключите уведомления о событиях.</p>
          <input type="text" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder="Ваш Chat ID" className={styles.input} />
          <Button type="primary" submit style={{ width: '100%' }}>Сохранить</Button>
        </form>
      </div>
    </div>
  );
};

export default TelegramWidget;