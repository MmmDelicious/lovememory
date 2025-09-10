import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Sidebar.module.css';
import Button from '../../components/Button/Button';
import eventService from '../../../modules/events/services/event.service';
import RecurrenceSelector from '../../../modules/events/components/Calendar/RecurrenceSelector';
import { toast } from '../../../context/ToastContext';
import { 
  FaTasks, FaBookmark, FaHeart, FaBirthdayCake, 
  FaPlane, FaWineGlass, FaGift, FaStar, FaChevronDown,
  FaTimes, FaPlus, FaTrash
} from 'react-icons/fa';
interface EventType {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
const EVENT_TYPES: EventType[] = [
  { value: 'plan', label: 'Планы', icon: FaTasks },
  { value: 'memory', label: 'Воспоминания', icon: FaBookmark },
  { value: 'anniversary', label: 'Годовщины', icon: FaHeart },
  { value: 'birthday', label: 'Дни рождения', icon: FaBirthdayCake },
  { value: 'travel', label: 'Путешествия', icon: FaPlane },
  { value: 'date', label: 'Свидания', icon: FaWineGlass },
  { value: 'gift', label: 'Подарки', icon: FaGift },
  { value: 'milestone', label: 'Важные моменты', icon: FaStar }
];
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
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (eventData) {
      const rawEvent = eventData.extendedProps?.rawEvent || eventData;
      setTitle(rawEvent.title || '');
      setDescription(rawEvent.description || '');
      setIsShared(!!rawEvent.isShared);
      setEventType(rawEvent.event_type || 'plan');
      setIsRecurring(!!rawEvent.is_recurring);
      setRecurrenceRule(rawEvent.recurrence_rule || null);
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
    } else {
      setTitle('');
      setDescription('');
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      setMedia([]);
      setIsShared(false);
      setEventType('plan');
      setIsRecurring(false);
      setRecurrenceRule(null);
    }
    setError('');
  }, [eventData]);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { 
        document.body.style.overflow = 'unset'; 
      };
    }
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    };
    if (isSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSelectOpen]);
  const fetchMedia = useCallback(async (eventId: string) => {
    try {
      const response = await eventService.getMediaForEvent(eventId);
      setMedia(response.data);
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  }, []);
  const handleSave = useCallback(() => {
    setError('');
    if (!title || title.trim() === '') {
      setError('Название обязательно');
      return;
    }
    const combineDateTime = (date: string, time: string): string | null => {
      if (!date) return null;
      if (time) {
        const localDateTime = new Date(`${date}T${time}`);
        return localDateTime.toISOString();
      } else {
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
  }, [eventData, title, description, startDate, startTime, endDate, endTime, eventType, isShared, isRecurring, recurrenceRule, onSave]);
  const handleDelete = useCallback(() => {
    if (eventData?.id && window.confirm('Вы уверены, что хотите удалить это событие?')) {
      onDelete(eventData.id);
    }
  }, [eventData?.id, onDelete]);
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && eventData?.id) {
      try {
        await eventService.uploadFile(eventData.id, file);
        fetchMedia(eventData.id);
        e.target.value = '';
      } catch (error) {
        toast.error('Не удалось загрузить файл.', 'Ошибка загрузки');
      }
    }
  }, [eventData?.id, fetchMedia]);
  const handleDeleteMedia = useCallback(async (mediaId: string) => {
    try {
      await eventService.deleteMedia(mediaId);
      if (eventData?.id) {
        fetchMedia(eventData.id);
      }
    } catch (error) {
      toast.error('Не удалось удалить файл.', 'Ошибка удаления');
    }
  }, [eventData?.id, fetchMedia]);
  const selectedEventType = EVENT_TYPES.find(type => type.value === eventType) || EVENT_TYPES[0];
  if (!isOpen || !eventData) return null;
  const mainDate = eventData.date || eventData.event_date;
  const formattedDate = mainDate ? new Date(mainDate).toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }) : '';
  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.sidebar} ref={sidebarRef}>
        {}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h2 className={styles.dateTitle}>{formattedDate}</h2>
            <button 
              className={styles.closeButton} 
              onClick={onClose}
              aria-label="Закрыть"
            >
              <FaTimes />
            </button>
          </div>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Название события" 
            className={styles.titleInput}
          />
        </div>
        {}
        <div className={styles.content}>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className={styles.form}>
            {}
            <div className={styles.section}>
              <label className={styles.sectionTitle}>Категория</label>
              <div className={styles.selectWrapper}>
                <button
                  type="button"
                  className={styles.selectButton}
                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                  aria-expanded={isSelectOpen}
                >
                  <div className={styles.selectValue}>
                    <selectedEventType.icon className={styles.typeIcon} />
                    <span>{selectedEventType.label}</span>
                  </div>
                  <FaChevronDown className={`${styles.selectArrow} ${isSelectOpen ? styles.selectArrowOpen : ''}`} />
                </button>
                {isSelectOpen && (
                  <div className={styles.selectDropdown}>
                    {EVENT_TYPES.map(type => {
                      const IconComponent = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          className={`${styles.selectOption} ${type.value === eventType ? styles.selectOptionActive : ''}`}
                          onClick={() => {
                            setEventType(type.value);
                            setIsSelectOpen(false);
                          }}
                        >
                          <IconComponent className={styles.typeIcon} />
                          <span>{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {error && <div className={styles.error}>{error}</div>}
            {}
            <div className={styles.section}>
              <label className={styles.sectionTitle}>Дата и время</label>
              <div className={styles.dateTimeGroup}>
                <label className={styles.fieldLabel}>Начало</label>
                <div className={styles.dateTimeRow}>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className={styles.input} 
                  />
                  <input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)} 
                    className={styles.input} 
                  />
                </div>
              </div>
              <div className={styles.dateTimeGroup}>
                <label className={styles.fieldLabel}>Окончание</label>
                <div className={styles.dateTimeRow}>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    className={styles.input} 
                  />
                  <input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    className={styles.input} 
                  />
                </div>
              </div>
            </div>
            {}
            <div className={styles.section}>
              <label className={styles.sectionTitle}>Описание</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Добавьте детали о событии..." 
                className={styles.textarea} 
                rows={4}
              />
            </div>
            {}
            <div className={styles.section}>
              <label className={styles.sectionTitle}>Настройки</label>
              <label className={styles.checkbox}>
                <input 
                  type="checkbox" 
                  checked={isShared} 
                  onChange={e => setIsShared(e.target.checked)} 
                />
                <span className={styles.checkboxCustom}></span>
                <span className={styles.checkboxLabel}>Поделиться с партнёром</span>
              </label>
              <label className={styles.checkbox}>
                <input 
                  type="checkbox" 
                  checked={isRecurring} 
                  onChange={e => {
                    setIsRecurring(e.target.checked);
                    if (!e.target.checked) setRecurrenceRule(null);
                  }} 
                />
                <span className={styles.checkboxCustom}></span>
                <span className={styles.checkboxLabel}>Повторяющееся событие</span>
              </label>
              {isRecurring && (
                <button 
                  type="button"
                  className={styles.recurrenceButton}
                  onClick={() => setShowRecurrenceModal(true)}
                >
                  {recurrenceRule ? 
                    `Повтор: ${recurrenceRule.freq.toLowerCase()} ${recurrenceRule.interval > 1 ? `(каждые ${recurrenceRule.interval})` : ''}` : 
                    'Настроить повторение'
                  }
                </button>
              )}
            </div>
            {}
            {eventData.id && (
              <div className={styles.section}>
                <label className={styles.sectionTitle}>Фотографии</label>
                <div className={styles.mediaGrid}>
                  {media.map(m => (
                    <div key={m.id} className={styles.mediaItem}>
                      <img src={`${eventService.FILES_BASE_URL}${m.file_url}`} alt="" />
                      <button
                        type="button"
                        className={styles.deleteMediaButton}
                        onClick={() => handleDeleteMedia(m.id)}
                        title="Удалить фото"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className={styles.addMediaButton} 
                    onClick={() => fileInputRef.current?.click()}
                    title="Добавить фото"
                  >
                    <FaPlus />
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
          </form>
        </div>
        <div className={styles.footer}>
          <div className={styles.actions}>
            {eventData.id && (
              <Button onClick={handleDelete} variant="secondary">
                Удалить
              </Button>
            )}
            {selectedDate && onViewDay && (
              <Button onClick={onViewDay} variant="outline">
                Посмотреть день
              </Button>
            )}
            <Button variant="primary" onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </div>
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
