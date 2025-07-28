import React, { useState, useEffect, useRef } from 'react';
import styles from './Sidebar.module.css';
import Button from '../Button/Button';
import eventService from '../../services/event.service';
import RecurrenceSelector from '../Calendar/RecurrenceSelector';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
};

const formatTime = (date) => {
  if (!date || !date.includes('T')) return '';
  return new Date(date).toTimeString().slice(0, 5);
};

const Sidebar = ({ isOpen, onClose, eventData, onSave, onDelete, selectedDate, onViewDay }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [media, setMedia] = useState([]);
  const [isShared, setIsShared] = useState(false);
  const [eventType, setEventType] = useState('plan');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState(null);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const EVENT_TYPES = [
    { value: 'plan', label: 'Планы', icon: '📅' },
    { value: 'memory', label: 'Воспоминания', icon: '💭' },
    { value: 'anniversary', label: 'Годовщины', icon: '💕' },
    { value: 'birthday', label: 'Дни рождения', icon: '🎂' },
    { value: 'travel', label: 'Путешествия', icon: '✈️' },
    { value: 'date', label: 'Свидания', icon: '💖' },
    { value: 'gift', label: 'Подарки', icon: '🎁' },
    { value: 'milestone', label: 'Важные моменты', icon: '⭐' }
  ];

  useEffect(() => {
    if (eventData) {
      const rawEvent = eventData.extendedProps?.rawEvent || eventData;
      
      setTitle(rawEvent.title || '');
      setDescription(rawEvent.description || '');
      setIsShared(!!rawEvent.isShared);
      setEventType(rawEvent.event_type || 'plan');
      setIsRecurring(!!rawEvent.is_recurring);
      setRecurrenceRule(rawEvent.recurrence_rule || null);
      
      setStartDate(formatDate(rawEvent.event_date || eventData.date));
      setStartTime(formatTime(rawEvent.event_date));
      
      setEndDate(formatDate(rawEvent.end_date));
      setEndTime(formatTime(rawEvent.end_date));

      if (rawEvent.id) {
        fetchMedia(rawEvent.id);
      } else {
        setMedia([]);
      }
    }
  }, [eventData]);

  const fetchMedia = async (eventId) => {
    try {
      const response = await eventService.getMediaForEvent(eventId);
      setMedia(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке медиа:", error);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    if (!title || title.trim() === '') {
      setError('Название обязательно');
      return;
    }

    const combineDateTime = (date, time) => {
      if (!date) return null;
      return time ? new Date(`${date}T${time}`).toISOString() : new Date(date).toISOString();
    };

    const finalStartDate = combineDateTime(startDate, startTime);
    const finalEndDate = combineDateTime(endDate, endTime);

    onSave({ 
      ...eventData, 
      title, 
      description,
      event_date: finalStartDate,
      end_date: finalEndDate,
      event_type: eventType,
      isShared,
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? recurrenceRule : null
    });
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить это событие?')) {
      onDelete(eventData.id);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && eventData.id) {
      try {
        await eventService.uploadFile(eventData.id, file);
        fetchMedia(eventData.id);
        e.target.value = null;
      } catch (error) {
        console.error("Ошибка при загрузке файла:", error);
        alert('Не удалось загрузить файл.');
      }
    }
  };

  if (!isOpen) return null;
  const mainDate = eventData.date || eventData.event_date;
  const formattedDate = new Date(mainDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose}></div>
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
            <h2 className={styles.title}>
              {eventData.title || 'Новое событие'}
            </h2>
            <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.dateInfo}>
          <span className={styles.dateLabel}>📅 {formattedDate}</span>
          {eventData.timeRange && (
            <span className={styles.timeLabel}>⏰ {eventData.timeRange}</span>
          )}
        </div>
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.scrollableContent}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Название <span className={styles.required}>*</span></label>
              <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название события" className={styles.input} required />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="eventType">Тип события</label>
              <select 
                id="eventType" 
                value={eventType} 
                onChange={(e) => setEventType(e.target.value)} 
                className={styles.input}
              >
                {EVENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.dateTimeRow}>
              <div className={styles.formGroup}>
                <label htmlFor="startDate">Дата начала</label>
                <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="startTime">Время</label>
                <input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={styles.input} />
              </div>
            </div>

            <div className={styles.dateTimeRow}>
              <div className={styles.formGroup}>
                <label htmlFor="endDate">Дата окончания</label>
                <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="endTime">Время</label>
                <input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={styles.input} />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description">Описание</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Добавьте описание..." className={styles.textarea} rows="5"></textarea>
            </div>
            
            <div className={styles.checkboxRow}>
              <input id="isShared" type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} />
              <label htmlFor="isShared">Показывать партнёру</label>
            </div>

            <div className={styles.checkboxRow}>
              <input 
                id="isRecurring" 
                type="checkbox" 
                checked={isRecurring} 
                onChange={e => {
                  setIsRecurring(e.target.checked);
                  if (!e.target.checked) {
                    setRecurrenceRule(null);
                  }
                }} 
              />
              <label htmlFor="isRecurring">Повторяющееся событие</label>
            </div>

            {isRecurring && (
              <div className={styles.recurrenceSection}>
                <button 
                  type="button"
                  className={styles.recurrenceButton}
                  onClick={() => setShowRecurrenceModal(true)}
                >
                  <span className={styles.recurrenceIcon}>🔄</span>
                  <span>
                    {recurrenceRule ? 
                      `${recurrenceRule.freq.toLowerCase()} ${recurrenceRule.interval > 1 ? `(каждые ${recurrenceRule.interval})` : ''}` : 
                      'Настроить повторение'
                    }
                  </span>
                </button>
              </div>
            )}

            {eventData.id && (
              <div className={styles.mediaSection}>
                <h3>Фотографии</h3>
                <div className={styles.mediaGrid}>
                  {media.map(m => (
                    <div key={m.id} className={styles.mediaItem}>
                      <img src={`${eventService.API_BASE_URL}${m.file_url}`} alt="Воспоминание" />
                    </div>
                  ))}
                  <button type="button" className={styles.addMediaButton} onClick={() => fileInputRef.current.click()}>
                    +
                  </button>
                </div>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />
              </div>
            )}
          </div>
          <div className={styles.actions}>
            <Button type="primary" submit>Сохранить</Button>
            {eventData.id && <Button onClick={handleDelete} type="secondary">Удалить</Button>}
            {selectedDate && (
              <Button onClick={onViewDay} type="outline">
                Посмотреть день
              </Button>
            )}
          </div>
        </form>
        
        <RecurrenceSelector
          isOpen={showRecurrenceModal}
          onClose={() => setShowRecurrenceModal(false)}
          onSave={(rule) => setRecurrenceRule(rule)}
          initialRule={recurrenceRule}
        />
      </div>
    </>
  );
};

export default Sidebar;