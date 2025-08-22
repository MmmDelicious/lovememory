import React, { useState, useEffect } from 'react';
import styles from './RecurrenceSelector.module.css';
interface FrequencyOption {
  value: string;
  label: string;
  icon: string;
}
interface RecurrenceRule {
  freq: string;
  interval: number;
  until?: string | null;
  count?: number | null;
}
interface RecurrenceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: RecurrenceRule) => void;
  initialRule?: RecurrenceRule | null;
}
const RecurrenceSelector: React.FC<RecurrenceSelectorProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialRule = null 
}) => {
  const [frequency, setFrequency] = useState('weekly');
  const [interval, setInterval] = useState(1);
  const [endType, setEndType] = useState<'never' | 'on' | 'count'>('never');
  const [endDate, setEndDate] = useState('');
  const [endCount, setEndCount] = useState(10);
  const FREQUENCIES: FrequencyOption[] = [
    { value: 'daily', label: 'Ежедневно', icon: '📅' },
    { value: 'weekly', label: 'Еженедельно', icon: '📆' },
    { value: 'monthly', label: 'Ежемесячно', icon: '🗓️' },
    { value: 'yearly', label: 'Ежегодно', icon: '🎂' }
  ];
  useEffect(() => {
    if (initialRule) {
      setFrequency(initialRule.freq.toLowerCase());
      setInterval(initialRule.interval || 1);
      if (initialRule.until) {
        setEndType('on');
        setEndDate(initialRule.until.split('T')[0]);
      } else if (initialRule.count) {
        setEndType('count');
        setEndCount(initialRule.count);
      }
    }
  }, [initialRule]);
  const handleSave = () => {
    const rule: RecurrenceRule = {
      freq: frequency.toUpperCase(),
      interval,
      until: endType === 'on' ? new Date(endDate).toISOString() : null,
      count: endType === 'count' ? endCount : null
    };
    onSave(rule);
    onClose();
  };
  const getFrequencyText = (): string => {
    const freq = FREQUENCIES.find(f => f.value === frequency);
    if (interval === 1) {
      return freq?.label || frequency;
    }
    const intervalText: Record<string, string> = {
      daily: `Каждые ${interval} дня`,
      weekly: `Каждые ${interval} недели`,
      monthly: `Каждые ${interval} месяца`,
      yearly: `Каждые ${interval} года`
    };
    return intervalText[frequency] || freq?.label || frequency;
  };
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Настройка повторения</h3>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        <div className={styles.content}>
          <div className={styles.section}>
            <label>Повторять</label>
            <div className={styles.frequencyGrid}>
              {FREQUENCIES.map(freq => (
                <button
                  key={freq.value}
                  className={`${styles.frequencyButton} ${frequency === freq.value ? styles.active : ''}`}
                  onClick={() => setFrequency(freq.value)}
                >
                  <span className={styles.icon}>{freq.icon}</span>
                  <span>{freq.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.section}>
            <label htmlFor="interval">Интервал</label>
            <div className={styles.intervalContainer}>
              <input
                id="interval"
                type="number"
                min="1"
                max="99"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className={styles.intervalInput}
              />
              <span className={styles.intervalText}>{getFrequencyText()}</span>
            </div>
          </div>
          <div className={styles.section}>
            <label>Окончание</label>
            <div className={styles.endOptions}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="endType"
                  value="never"
                  checked={endType === 'never'}
                  onChange={(e) => setEndType(e.target.value as 'never')}
                />
                <span>Никогда</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="endType"
                  value="on"
                  checked={endType === 'on'}
                  onChange={(e) => setEndType(e.target.value as 'on')}
                />
                <span>Дата окончания:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setEndType('on');
                  }}
                  className={styles.dateInput}
                  disabled={endType !== 'on'}
                />
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="endType"
                  value="count"
                  checked={endType === 'count'}
                  onChange={(e) => setEndType(e.target.value as 'count')}
                />
                <span>После</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={endCount}
                  onChange={(e) => {
                    setEndCount(parseInt(e.target.value) || 1);
                    setEndType('count');
                  }}
                  className={styles.countInput}
                  disabled={endType !== 'count'}
                />
                <span>событий</span>
              </label>
            </div>
          </div>
          <div className={styles.preview}>
            <h4>Предварительный просмотр:</h4>
            <p className={styles.previewText}>
              {getFrequencyText()}
              {endType === 'on' && endDate ? ` до ${new Date(endDate).toLocaleDateString('ru-RU')}` : ''}
              {endType === 'count' ? ` (всего ${endCount} раз)` : ''}
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Отмена
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};
export default RecurrenceSelector;

