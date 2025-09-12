import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { EventCard, ActionButton } from '../../../../ui/calendar';
import { useDayDetail } from '../../hooks/useDayDetail';
import { useEvents } from '../../hooks/useEvents';
import { toast } from '../../../../context/ToastContext';
import { 
  FaCalendarPlus, FaImage, FaHeart, FaBirthdayCake, FaPlane, FaGift, FaStar, 
  FaCommentDots, FaCalendarCheck, FaGlassCheers, FaUsers, FaArrowLeft,
  FaShare, FaUpload, FaMapMarkerAlt, FaClock, FaTasks, FaPlay,
  FaSmile, FaLaugh, FaGrinHearts, FaMeh, FaThumbsUp, FaFire,
  FaSun, FaCoffee, FaMoon
} from 'react-icons/fa';
import styles from './DayDetailModule.module.css';

interface DayDetailModuleProps {
  date: string; // YYYY-MM-DD format
  userId: string;
  onNavigateBack?: () => void;
  onEventEdit?: (eventId: string) => void;
  onEventCreate?: (eventData: any) => void;
  className?: string;
}

// Конфигурация типов событий
const eventTypeDetails = {
  memory: { icon: FaCommentDots, label: 'Воспоминание', color: '#4a90e2' },
  plan: { icon: FaCalendarCheck, label: 'План', color: '#50e3c2' },
  anniversary: { icon: FaHeart, label: 'Годовщина', color: '#e91e63' },
  birthday: { icon: FaBirthdayCake, label: 'День рождения', color: '#f5a623' },
  travel: { icon: FaPlane, label: 'Путешествие', color: '#7ed321' },
  date: { icon: FaGlassCheers, label: 'Свидание', color: '#bd10e0' },
  gift: { icon: FaGift, label: 'Подарок', color: '#9013fe' },
  deadline: { icon: FaStar, label: 'Дедлайн', color: '#f8e71c' },
  default: { icon: FaCalendarCheck, label: 'Событие', color: '#8b572a' },
};

// Группы времени дня
const timeOfDayGroups = {
  morning: { label: 'Утро', icon: FaSun, range: [6, 12] },
  afternoon: { label: 'День', icon: FaCoffee, range: [12, 18] },
  evening: { label: 'Вечер', icon: FaMoon, range: [18, 24] },
  night: { label: 'Ночь', icon: FaMoon, range: [0, 6] }
};

// Типы реакций
const reactionTypes = [
  { icon: FaHeart, label: 'Обожаю', color: '#e91e63' },
  { icon: FaLaugh, label: 'Смешно', color: '#ff9800' },
  { icon: FaGrinHearts, label: 'Восхитительно', color: '#e91e63' },
  { icon: FaSmile, label: 'Спокойно', color: '#4caf50' },
  { icon: FaThumbsUp, label: 'Мило', color: '#2196f3' },
  { icon: FaFire, label: 'Огонь', color: '#ff5722' }
];

/**
 * Самостоятельный модуль детального просмотра дня
 * Отвечает за: отображение событий дня, управление медиа, реакции, комментарии
 * Содержит собственное состояние, API-вызовы, обработку ошибок
 */
export const DayDetailModule: React.FC<DayDetailModuleProps> = ({
  date,
  userId,
  onNavigateBack,
  onEventEdit,
  onEventCreate,
  className
}) => {
  // Состояние модуля
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [draggedMedia, setDraggedMedia] = useState<any>(null);
  const [dragOverEvent, setDragOverEvent] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState<Record<string, boolean>>({});
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [eventReactions, setEventReactions] = useState<Record<string, any[]>>({});

  // Хуки для данных и логики
  const { 
    events, 
    isLoading, 
    error, 
    updateEvent, 
    deleteEvent,
    uploadMedia,
    moveMedia
  } = useDayDetail(date, userId);

  // Вспомогательные функции
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'cccc, d MMMM yyyy', { locale: ru });
  };

  const formatTime = (dateString: string) => format(new Date(dateString), 'HH:mm', { locale: ru });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ч ${mins > 0 ? mins + ' м' : ''}`.trim();
    }
    return `${mins} м`;
  };

  const getTimeOfDay = (eventDate: string) => {
    const hour = new Date(eventDate).getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  };

  const groupEventsByTimeOfDay = (events: any[]) => {
    const grouped = { morning: [], afternoon: [], evening: [], night: [] } as any;
    events.forEach(event => {
      const timeOfDay = getTimeOfDay(event.event_date);
      grouped[timeOfDay].push(event);
    });
    return grouped;
  };

  // Обработчики событий
  const handleEventEdit = (eventId: string) => {
    if (onEventEdit) {
      onEventEdit(eventId);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить это событие?')) return;
    
    try {
      await deleteEvent(eventId);
      toast.success('Событие удалено');
    } catch (error) {
      toast.error('Не удалось удалить событие');
    }
  };

  const handleCompleteEvent = async (eventId: string) => {
    try {
      await updateEvent(eventId, { completed: true });
      toast.success('Событие отмечено как завершённое!');
    } catch (error) {
      toast.error('Не удалось обновить событие');
    }
  };

  const handleFileUpload = async (eventId: string, files: FileList) => {
    if (!files || files.length === 0) return;
    
    setUploadingMedia(prev => ({ ...prev, [eventId]: true }));
    
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(eventId, file);
      }
      toast.success('Медиа добавлено в событие!');
    } catch (error) {
      toast.error('Не удалось загрузить файлы');
    } finally {
      setUploadingMedia(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleReaction = (eventId: string, reactionType: any) => {
    setEventReactions(prev => ({
      ...prev,
      [eventId]: [...(prev[eventId] || []), { reactionType, timestamp: Date.now() }]
    }));
    toast.success(`Реакция "${reactionType.label}" добавлена!`);
  };

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const handleQuickEventAdd = (template: string) => {
    if (onEventCreate) {
      onEventCreate({ template, date });
    }
  };

  // Drag & Drop для медиа
  const handleDragStart = (e: React.DragEvent, media: any, sourceEventId: string) => {
    setDraggedMedia({ ...media, sourceEventId });
  };

  const handleDragOver = (e: React.DragEvent, eventId: string) => {
    e.preventDefault();
    setDragOverEvent(eventId);
  };

  const handleDragLeave = () => {
    setDragOverEvent(null);
  };

  const handleDrop = async (e: React.DragEvent, targetEventId: string) => {
    e.preventDefault();
    setDragOverEvent(null);
    
    if (!draggedMedia || draggedMedia.sourceEventId === targetEventId) return;
    
    try {
      await moveMedia(draggedMedia.id, targetEventId);
      toast.success('Медиа перемещено');
    } catch (error) {
      toast.error('Не удалось переместить медиа');
    } finally {
      setDraggedMedia(null);
    }
  };

  // Render
  if (isLoading) {
    return (
      <div className={`${styles.dayDetailModule} ${className || ''}`}>
        <div className={styles.loading}>Загрузка событий дня...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.dayDetailModule} ${className || ''}`}>
        <div className={styles.error}>Ошибка: {error}</div>
      </div>
    );
  }

  const groupedEvents = groupEventsByTimeOfDay(events);
  const hasEvents = events.length > 0;

  return (
    <div className={`${styles.dayDetailModule} ${className || ''}`}>
      {/* Header */}
      <header className={styles.header}>
        {onNavigateBack && (
          <ActionButton
            icon={FaArrowLeft}
            variant="ghost"
            onClick={onNavigateBack}
          >
            Назад
          </ActionButton>
        )}
        
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{formatDate(date)}</h1>
          <div className={styles.meta}>
            {hasEvents && (
              <span className={styles.eventCount}>
                {events.length} {events.length === 1 ? 'событие' : 'событий'}
              </span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <ActionButton
            icon={FaShare}
            variant="outline"
            size="small"
          >
            Поделиться
          </ActionButton>
          
          <ActionButton
            icon={FaPlay}
            variant="primary"
            size="small"
          >
            Stories
          </ActionButton>
        </div>
      </header>

      {/* Content */}
      <main className={styles.content}>
        {!hasEvents ? (
          <div className={styles.emptyState}>
            <FaCalendarPlus className={styles.emptyIcon} />
            <h2>Каждый день — шанс на маленькое чудо. Добавим что-то?</h2>
            <div className={styles.quickTemplates}>
              <ActionButton 
                variant="outline" 
                onClick={() => handleQuickEventAdd('date')}
              >
                Свидание сегодня
              </ActionButton>
              <ActionButton 
                variant="outline" 
                onClick={() => handleQuickEventAdd('memory')}
              >
                Добавить воспоминание
              </ActionButton>
              <ActionButton 
                variant="outline" 
                onClick={() => handleQuickEventAdd('plan')}
              >
                Вечер дома
              </ActionButton>
            </div>
          </div>
        ) : (
          <div className={styles.timeline}>
            {Object.entries(timeOfDayGroups).map(([timeKey, timeGroup]) => {
              const timeEvents = groupedEvents[timeKey];
              if (timeEvents.length === 0) return null;
              
              const TimeIcon = timeGroup.icon;
              
              return (
                <div key={timeKey} className={styles.timeGroup}>
                  <div className={styles.timeGroupHeader}>
                    <div className={styles.timelineNode}>
                      <TimeIcon />
                    </div>
                    <h3 className={styles.timeGroupTitle}>{timeGroup.label}</h3>
                  </div>
                  
                  <div className={styles.timeGroupEvents}>
                    {timeEvents.map((event: any) => {
                      const { icon: EventIcon, label, color } = eventTypeDetails[event.event_type] || eventTypeDetails.default;
                      const isExpanded = expandedEvents[event.id];
                      const eventReactionsList = eventReactions[event.id] || [];
                      
                      return (
                        <EventCard
                          key={event.id}
                          title={event.title}
                          time={`${formatTime(event.event_date)}${event.duration ? ` • ${formatDuration(event.duration)}` : ''}`}
                          description={isExpanded || !event.description || event.description.length <= 150 
                            ? event.description 
                            : `${event.description.substring(0, 150)}...`
                          }
                          color={color}
                          icon={EventIcon}
                          isShared={event.isShared}
                          isImportant={event.isImportant}
                          isCompleted={event.completed}
                          onEdit={() => handleEventEdit(event.id)}
                          onDelete={() => handleEventDelete(event.id)}
                          className={styles.eventCard}
                        >
                          {/* Описание с кнопкой разворачивания */}
                          {event.description && event.description.length > 150 && (
                            <ActionButton
                              variant="ghost"
                              size="small"
                              onClick={() => toggleEventExpansion(event.id)}
                            >
                              {isExpanded ? 'Свернуть' : 'Показать полностью'}
                            </ActionButton>
                          )}

                          {/* Медиа зона */}
                          <div
                            className={`${styles.mediaSection} ${dragOverEvent === event.id ? styles.dragOver : ''}`}
                            onDragOver={(e) => handleDragOver(e, event.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, event.id)}
                          >
                            {event.media?.length > 0 ? (
                              <div className={styles.mediaGrid}>
                                {event.media.slice(0, 4).map((media: any, index: number) => (
                                  <div
                                    key={media.id}
                                    className={styles.mediaItem}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, media, event.id)}
                                    onClick={() => setSelectedImage(media.file_url)}
                                  >
                                    <img 
                                      src={media.file_url} 
                                      alt="" 
                                      className={styles.mediaImage} 
                                    />
                                    {index === 0 && event.media.length > 4 && (
                                      <div className={styles.mediaOverlay}>
                                        +{event.media.length - 4}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={styles.emptyMediaHint}>
                                Перетащите сюда фотографии или нажмите для загрузки
                              </div>
                            )}
                            
                            {uploadingMedia[event.id] && (
                              <div className={styles.uploadingIndicator}>Загрузка...</div>
                            )}
                          </div>

                          {/* Реакции */}
                          <div className={styles.eventReactions}>
                            <div className={styles.reactionButtons}>
                              {reactionTypes.map(reaction => {
                                const ReactionIcon = reaction.icon;
                                return (
                                  <button
                                    key={reaction.label}
                                    className={styles.reactionButton}
                                    onClick={() => handleReaction(event.id, reaction)}
                                    title={reaction.label}
                                    style={{ color: reaction.color }}
                                  >
                                    <ReactionIcon />
                                  </button>
                                );
                              })}
                            </div>
                            
                            {eventReactionsList.length > 0 && (
                              <div className={styles.reactionsList}>
                                {eventReactionsList.slice(-3).map((reaction, index) => {
                                  const ReactionIcon = reaction.reactionType?.icon || FaThumbsUp;
                                  return (
                                    <span 
                                      key={index} 
                                      className={styles.reactionItem} 
                                      style={{ color: reaction.reactionType?.color }}
                                    >
                                      <ReactionIcon />
                                    </span>
                                  );
                                })}
                                {eventReactionsList.length > 3 && (
                                  <span className={styles.moreReactions}>
                                    +{eventReactionsList.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Кнопки управления */}
                          {event.event_type === 'plan' && !event.completed && (
                            <ActionButton 
                              variant="primary"
                              size="small"
                              onClick={() => handleCompleteEvent(event.id)}
                            >
                              Отметить завершённым
                            </ActionButton>
                          )}
                        </EventCard>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Модал просмотра изображения */}
      {selectedImage && (
        <div className={styles.imageModal} onClick={() => setSelectedImage(null)}>
          <img 
            src={selectedImage} 
            alt="Просмотр" 
            className={styles.fullSizeImage} 
            onClick={(e) => e.stopPropagation()} 
          />
          <button 
            className={styles.closeModalButton} 
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
