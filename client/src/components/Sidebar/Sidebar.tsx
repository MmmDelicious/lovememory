import React, { useState, useEffect, useRef } from 'react';
import styles from './Sidebar.module.css';
import Button from '../Button/Button';
import eventService from '../../services/event.service';
import RecurrenceSelector from '../Calendar/RecurrenceSelector';

interface EventType {
  value: string;
  label: string;
  icon: string;
}

interface MediaItem {
  id: string;
  file_url: string;
}

interface EventData {
  id?: string;
  title?: string;
  description?: string;
  event_date?: string;
  end_date?: string;
  event_type?: string;
  isShared?: boolean;
  is_recurring?: boolean;
  recurrence_rule?: any;
  date?: string;
  timeRange?: string;
  extendedProps?: {
    rawEvent?: EventData;
  };
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: EventData | null;
  onSave: (eventData: EventData) => void;
  onDelete: (eventId: string) => void;
  selectedDate: string | null;
  onViewDay?: () => void;
}

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
};

const formatTime = (date: string | null | undefined): string => {
  if (!date || !date.includes('T')) return '';
  return new Date(date).toTimeString().slice(0, 5);
};

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  eventData, 
  onSave, 
  onDelete, 
  selectedDate, 
  onViewDay 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isShared, setIsShared] = useState(false);
  const [eventType, setEventType] = useState('plan');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<any>(null);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const EVENT_TYPES: EventType[] = [
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
      
      // Apply defaults: base 08:00 - 09:00 when creating a new event
      const baseDateISO = rawEvent.event_date || eventData.event_date || (eventData.date ? `${eventData.date}T08:00:00` : null);
      const baseEndISO = rawEvent.end_date || (baseDateISO ? new Date(new Date(baseDateISO).getTime() + 60*60*1000).toISOString() : null);

      setStartDate(formatDate(baseDateISO || eventData.date));
      setStartTime(formatTime(baseDateISO));
      
      setEndDate(formatDate(baseEndISO));
      setEndTime(formatTime(baseEndISO));

      if (rawEvent.id) {
        fetchMedia(rawEvent.id);
      } else {
        setMedia([]);
      }
    }
  }, [eventData]);

  // Body scroll lock while sidebar is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { 
        document.body.style.overflow = originalOverflow; 
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const fetchMedia = async (eventId: string) => {
    try {
      const response = await eventService.getMediaForEvent(eventId);
      setMedia(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке медиа:", error);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title || title.trim() === '') {
      setError('Название обязательно');
      return;
    }

    const combineDateTime = (date: string, time: string): string | null => {
      if (!date) return null;
      if (time) {
        // Интерпретируем как локальное время и сохраняем в ISO (UTC) без ручных сдвигов
        const localDateTime = new Date(`${date}T${time}`);
        return localDateTime.toISOString();
      } else {
        // Локальная полуночь, затем ISO (UTC)
        const localStartOfDay = new Date(`${date}T00:00:00`);
        return localStartOfDay.toISOString();
      }
    };

    const finalStartDate = combineDateTime(startDate, startTime);
    const finalEndDate = combineDateTime(endDate, endTime);

    onSave({ 
      ...eventData, 
      title, 
      description,
      event_date: finalStartDate!,
      end_date: finalEndDate || undefined,
      event_type: eventType,
      isShared,
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? recurrenceRule : null
    });
  };

  const handleDelete = () => {
    if (eventData?.id && window.confirm('Вы уверены, что хотите удалить это событие?')) {
      onDelete(eventData.id);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && eventData?.id) {
      try {
        await eventService.uploadFile(eventData.id, file);
        fetchMedia(eventData.id);
        e.target.value = '';
      } catch (error) {
        console.error("Ошибка при загрузке файла:", error);
        alert('Не удалось загрузить файл.');
      }
    }
  };

  if (!isOpen || !eventData) return null;
  
  const mainDate = eventData.date || eventData.event_date;
  const formattedDate = mainDate ? new Date(mainDate).toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }) : '';

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose}></div>
      <div
        ref={dialogRef}
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className={styles.header}>
            <h2 id="sidebar-title" className={styles.title}>
              {eventData.title || 'Новое событие'}
            </h2>
            <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть боковую панель">×</button>
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
              <input 
                id="title" 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Название события" 
                className={styles.input} 
                required 
              />
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
                <input 
                  id="startDate" 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className={styles.input} 
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="startTime">Время</label>
                <input 
                  id="startTime" 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  className={styles.input} 
                />
              </div>
            </div>

            <div className={styles.dateTimeRow}>
              <div className={styles.formGroup}>
                <label htmlFor="endDate">Дата окончания</label>
                <input 
                  id="endDate" 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className={styles.input} 
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="endTime">Время</label>
                <input 
                  id="endTime" 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  className={styles.input} 
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description">Описание</label>
              <textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Добавьте описание..." 
                className={styles.textarea} 
                rows={5}
              />
            </div>
            
            <div className={styles.checkboxRow}>
              <input 
                id="isShared" 
                type="checkbox" 
                checked={isShared} 
                onChange={e => setIsShared(e.target.checked)} 
              />
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
                      <img src={`${eventService.FILES_BASE_URL}${m.file_url}`} alt="Воспоминание" />
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className={styles.addMediaButton} 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    +
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                />
              </div>
            )}
          </div>
          <div className={styles.actions}>
            <Button type="primary" submit>Сохранить</Button>
            {eventData.id && <Button onClick={handleDelete} type="secondary">Удалить</Button>}
            {selectedDate && onViewDay && (
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
