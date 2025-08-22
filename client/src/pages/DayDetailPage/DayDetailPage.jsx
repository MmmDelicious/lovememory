import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import eventService from '../../services/event.service';
import styles from './DayDetailPage.module.css';
import { toast } from '../../context/ToastContext';
import Button from '../../components/Button/Button';
import StoryViewer from '../../components/StoryViewer/StoryViewer';
import { 
  FaCalendarPlus, FaImage, FaHeart, FaBirthdayCake, FaPlane, FaGift, FaStar, 
  FaCommentDots, FaCalendarCheck, FaGlassCheers, FaUsers, FaArrowLeft,
  FaShare, FaUpload, FaMapMarkerAlt, FaClock, FaTasks, FaLock, FaPlay, FaPause,
  FaSmile, FaLaugh, FaGrinHearts, FaMeh, FaEllipsisH, FaDownload,
  FaSun, FaCoffee, FaMoon, FaThumbsUp, FaFire
} from 'react-icons/fa';
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
const timeOfDayGroups = {
  morning: { label: 'Утро', icon: FaSun, range: [6, 12] },
  afternoon: { label: 'День', icon: FaCoffee, range: [12, 18] },
  evening: { label: 'Вечер', icon: FaMoon, range: [18, 24] },
  night: { label: 'Ночь', icon: FaMoon, range: [0, 6] }
};
const reactionTypes = [
  { icon: FaHeart, label: 'Обожаю', color: '#e91e63' },
  { icon: FaLaugh, label: 'Смешно', color: '#ff9800' },
  { icon: FaGrinHearts, label: 'Восхитительно', color: '#e91e63' },
  { icon: FaSmile, label: 'Спокойно', color: '#4caf50' },
  { icon: FaThumbsUp, label: 'Мило', color: '#2196f3' },
  { icon: FaFire, label: 'Огонь', color: '#ff5722' }
];
const DayDetailPage = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [draggedMedia, setDraggedMedia] = useState(null);
  const [dragOverEvent, setDragOverEvent] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState({});
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [eventReactions, setEventReactions] = useState({});
  const [partnerComments, setPartnerComments] = useState({});
  const [dayMood, setDayMood] = useState('');
  const [sharedTime, setSharedTime] = useState(0);
  const [relationshipStartDate] = useState(new Date('2023-01-01')); // Примерная дата начала отношений
  const fileInputRefs = useRef({});
  const getTimeOfDay = (eventDate) => {
    const hour = new Date(eventDate).getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  };
  const groupEventsByTimeOfDay = (events) => {
    const grouped = { morning: [], afternoon: [], evening: [], night: [] };
    events.forEach(event => {
      const timeOfDay = getTimeOfDay(event.event_date);
      grouped[timeOfDay].push(event);
    });
    return grouped;
  };
  const calculateDaysTogetherCount = () => {
    const daysDiff = differenceInDays(new Date(date), relationshipStartDate);
    return Math.max(0, daysDiff);
  };
  const calculateSharedTimeToday = (events) => {
    return events.reduce((total, event) => {
      if (event.duration) return total + event.duration;
      return total + 60; // Базовое время события - 1 час
    }, 0);
  };
  const fetchDayEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvents();
      const dayEvents = response.data.filter(event => 
        new Date(event.event_date).toISOString().split('T')[0] === date
      );
      dayEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      const eventsWithoutMedia = dayEvents.map(event => ({
        ...event,
        media: [],
        reactions: [],
        partnerNote: ''
      }));
      setEvents(eventsWithoutMedia);
      setSharedTime(calculateSharedTimeToday(eventsWithoutMedia));
      setLoading(false);
      const eventsWithMedia = await Promise.all(
        dayEvents.map(async (event) => {
          try {
            const mediaResponse = await eventService.getMediaForEvent(event.id);
            return { 
              ...event, 
              media: mediaResponse.data || [],
              reactions: [],
              partnerNote: ''
            };
          } catch (error) {
            return {
              ...event,
              media: [],
              reactions: [],
              partnerNote: ''
            };
          }
        })
      );
      setEvents(eventsWithMedia);
    } catch (err) {
      setError('Не удалось загрузить события дня');
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDayEvents();
  }, [date]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[class*="eventMenuWrapper"]')) {
        setExpandedEvents(prev => {
          const newState = { ...prev };
          Object.keys(newState).forEach(key => {
            if (key.startsWith('menu_')) {
              delete newState[key];
            }
          });
          return newState;
        });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'cccc, d MMMM yyyy', { locale: ru });
  };
  const formatTime = (dateString) => format(new Date(dateString), 'HH:mm', { locale: ru });
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ч ${mins > 0 ? mins + ' м' : ''}`.trim();
    }
    return `${mins} м`;
  };
  const handleDragStart = (e, media, sourceEventId) => setDraggedMedia({ ...media, sourceEventId });
  const handleDragOver = (e, eventId) => { e.preventDefault(); setDragOverEvent(eventId); };
  const handleDragLeave = () => setDragOverEvent(null);
  const handleDrop = async (e, targetEventId) => {
    e.preventDefault();
    setDragOverEvent(null);
    if (!draggedMedia || draggedMedia.sourceEventId === targetEventId) return;
    try {
      await eventService.moveMediaToEvent(draggedMedia.id, targetEventId);
      fetchDayEvents();
      toast.success('Фото перемещено', 'Готово!');
    } catch (error) {
      toast.error('Не удалось переместить фотографию', 'Ошибка');
    } finally {
      setDraggedMedia(null);
    }
  };
  const handleFileSelect = async (eventId, files) => {
    if (!files || files.length === 0) return;
    setUploadingMedia(prev => ({ ...prev, [eventId]: true }));
    try {
      await Promise.all(Array.from(files).map(file => eventService.uploadFile(eventId, file)));
      await fetchDayEvents();
      toast.success('Фото добавлено в нашу историю!', 'Готово!');
    } catch (error) {
      toast.error('Не удалось загрузить файлы', 'Ошибка загрузки');
    } finally {
      setUploadingMedia(prev => ({ ...prev, [eventId]: false }));
    }
  };
  const handleReaction = (eventId, reactionType) => {
    setEventReactions(prev => ({
      ...prev,
      [eventId]: [...(prev[eventId] || []), { reactionType, timestamp: Date.now() }]
    }));
    toast.success(`Реакция "${reactionType.label}" добавлена!`, '');
  };
  const toggleEventExpansion = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };
  const handleAddPartnerComment = (eventId, comment) => {
    setPartnerComments(prev => ({
      ...prev,
      [eventId]: comment
    }));
  };
  const handleQuickEventAdd = (template) => {
    navigate('/dashboard', { state: { quickAdd: template, date } });
  };
  const handleShareDay = () => {
    const shareUrl = `${window.location.origin}/day/${date}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Ссылка скопирована!', 'День готов к просмотру');
  };
  const handleExportDay = (format) => {
    toast.success(`Экспорт в ${format} начат`, 'Файл будет готов через минуту');
  };
  const openStoryMode = () => {
    if (events.length === 0) {
      toast.warning('Нет событий для показа', 'Story mode');
      return;
    }
    setStoryViewerOpen(true);
  };
  const closeStoryMode = () => {
    setStoryViewerOpen(false);
  };
  const handleEditEvent = (eventId) => {
    navigate(`/event/edit/${eventId}`);
  };
  const handleDuplicateEvent = async (event) => {
    try {
      const duplicatedEvent = {
        ...event,
        title: `${event.title} (копия)`,
        event_date: new Date().toISOString(),
        id: undefined
      };
      toast.success('Событие дублировано!', 'Копия создана');
      fetchDayEvents();
    } catch (error) {
      toast.error('Не удалось дублировать событие', 'Ошибка');
    }
  };
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это событие?')) return;
    try {
      await eventService.deleteEvent(eventId);
      toast.success('Событие удалено', 'Готово');
      fetchDayEvents();
    } catch (error) {
      toast.error('Не удалось удалить событие', 'Ошибка');
    }
  };
  const handleCompleteEvent = async (eventId) => {
    try {
      await eventService.updateEvent(eventId, { completed: true });
      toast.success('Событие отмечено как завершённое!', 'Готово');
      fetchDayEvents();
    } catch (error) {
      toast.error('Не удалось обновить событие', 'Ошибка');
    }
  };
  const handleEventMenuAction = (action, event) => {
    switch (action) {
      case 'edit':
        handleEditEvent(event.id);
        break;
      case 'duplicate':
        handleDuplicateEvent(event);
        break;
      case 'delete':
        handleDeleteEvent(event.id);
        break;
      case 'setReminder':
        toast.success('Напоминание установлено', 'Уведомим вас вовремя');
        break;
      case 'makeEventCover':
        toast.success('Событие назначено обложкой дня', 'Готово');
        break;
      default:
        break;
    }
  };
  if (loading && events.length === 0) return <div className={styles.pageStateContainer}><div className={styles.loadingSpinner}></div></div>;
  if (error && events.length === 0) return <div className={styles.pageStateContainer}><p>{error}</p></div>;
  const daysTogetherCount = calculateDaysTogetherCount();
  const groupedEvents = groupEventsByTimeOfDay(events);
  return (
    <div className={styles.container}>
      {}
      <main className={styles.timeline}>
        {events.length === 0 ? (
          <div className={styles.emptyDayState}>
            <FaCalendarPlus className={styles.emptyIcon} />
            <h2>Каждый день — шанс на маленькое чудо. Добавим что-то?</h2>
            <div className={styles.quickTemplates}>
              <Button 
                variant="outline" 
                onClick={() => handleQuickEventAdd('date')}
              >
                Свидание сегодня
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleQuickEventAdd('memory')}
              >
                Добавить воспоминание
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleQuickEventAdd('plan')}
              >
                Вечер дома
              </Button>
              {}
              <Button 
                variant="primary" 
                onClick={openStoryMode}
                style={{ marginTop: '1rem' }}
              >
                <FaPlay style={{ marginRight: '0.5rem' }} />
                Посмотреть день как Stories
              </Button>
              {}
              <Button 
                variant="outline" 
                onClick={() => toast.success('Тест тоста!', 'Проверка работы')}
                style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
              >
                🧪 Тест Toast
              </Button>
            </div>
          </div>
        ) : (
          <>
            {}
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
                    {timeEvents.map(event => {
                      const { icon: EventIcon, label, color } = eventTypeDetails[event.event_type] || eventTypeDetails.default;
                      const isExpanded = expandedEvents[event.id];
                      const eventReactionsList = eventReactions[event.id] || [];
                      const partnerNote = partnerComments[event.id];
                      return (
                        <div key={event.id} className={styles.eventCard}>
                          {}
                          <div className={styles.eventCardHeader}>
                            <div className={styles.eventTypeIcon} style={{ backgroundColor: `${color}20`, borderColor: color }}>
                              <EventIcon style={{ color }} />
                            </div>
                            <div className={styles.eventHeaderContent}>
                              <div className={styles.eventTitleRow}>
                                <h4 className={styles.eventTitle}>{event.title}</h4>
                                <div className={styles.eventBadges}>
                                  <span className={styles.eventTypeBadge} style={{ color, borderColor: color, backgroundColor: `${color}15` }}>
                                    {label}
                                  </span>
                                  {event.isShared && (
                                    <span className={styles.sharedBadge}>
                                      <FaUsers /> Общее
                                    </span>
                                  )}
                                  {event.isImportant && (
                                    <span className={styles.importantBadge}>
                                      <FaStar /> Важно
                                    </span>
                                  )}
                                </div>
                              </div>
                  <div className={styles.eventMeta}>
                                <span className={styles.eventTime}>
                                  {formatTime(event.event_date)}
                                  {event.duration && ` • ${formatDuration(event.duration)}`}
                                </span>
                                {event.location && (
                                  <span className={styles.eventLocation}>
                                    <FaMapMarkerAlt /> {event.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={styles.eventMenuWrapper}>
                              <button 
                                className={styles.eventMenuButton}
                                onClick={() => setExpandedEvents(prev => ({
                                  ...prev,
                                  [`menu_${event.id}`]: !prev[`menu_${event.id}`]
                                }))}
                              >
                                <FaEllipsisH />
                              </button>
                              {expandedEvents[`menu_${event.id}`] && (
                                <div className={styles.eventMenuDropdown}>
                                  <button onClick={() => handleEventMenuAction('edit', event)}>
                                    Редактировать
                                  </button>
                                  <button onClick={() => handleEventMenuAction('duplicate', event)}>
                                    Дублировать
                                  </button>
                                  <button onClick={() => handleEventMenuAction('setReminder', event)}>
                                    Напоминание
                                  </button>
                                  <button onClick={() => handleEventMenuAction('makeEventCover', event)}>
                                    Сделать обложкой
                                  </button>
                                  <hr />
                                  <button 
                                    onClick={() => handleEventMenuAction('delete', event)}
                                    className={styles.deleteMenuItem}
                                  >
                                    Удалить
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {}
                          <div className={styles.eventCardBody}>
                            {event.description && (
                              <div className={styles.eventDescription}>
                                <p>
                                  {isExpanded || event.description.length <= 150 
                                    ? event.description 
                                    : `${event.description.substring(0, 150)}...`
                                  }
                                </p>
                                {event.description.length > 150 && (
                                  <button 
                                    className={styles.expandButton}
                                    onClick={() => toggleEventExpansion(event.id)}
                                  >
                                    {isExpanded ? 'Свернуть' : 'Показать полностью'}
                                  </button>
                                )}
                              </div>
                            )}
                            {}
                            {event.event_type === 'plan' && event.subtasks && (
                              <div className={styles.subtasksList}>
                                {event.subtasks.map((task, index) => (
                                  <div key={index} className={styles.subtaskItem}>
                                    <input type="checkbox" checked={task.completed} readOnly />
                                    <span className={task.completed ? styles.completedTask : ''}>
                                      {task.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {}
                            {partnerNote && (
                              <div className={styles.partnerNote}>
                                <div className={styles.partnerNoteHeader}>
                                  <FaCommentDots />
                                  <span>Заметка партнёра:</span>
                                </div>
                                <p>{partnerNote}</p>
                              </div>
                            )}
                            {}
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
                                      <span key={index} className={styles.reactionItem} style={{ color: reaction.reactionType?.color }}>
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
                </div>
                          {}
                <div
                            className={`${styles.eventMediaSection} ${dragOverEvent === event.id ? styles.dragOver : ''}`}
                  onDragOver={(e) => handleDragOver(e, event.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, event.id)}
                >
                            {event.media.length > 0 ? (
                  <div className={styles.mediaGrid}>
                                {event.media.slice(0, 4).map((media, index) => (
                      <div
                        key={media.id}
                                    className={`${styles.mediaItem} ${draggedMedia?.id === media.id ? styles.dragging : ''} ${index === 0 ? styles.heroMedia : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, media, event.id)}
                        onClick={() => setSelectedImage(`${eventService.FILES_BASE_URL}${media.file_url}`)}
                      >
                                    <img 
                                      src={`${eventService.FILES_BASE_URL}${media.file_url}`} 
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
                                Здесь будет ваша история в кадрах
                    </div>
                  )}
                            {uploadingMedia[event.id] && (
                              <div className={styles.uploadingIndicator}>Загрузка...</div>
                            )}
                </div>
                          {}
                          <div 
                            className={styles.mediaDropZone}
                            onClick={() => fileInputRefs.current[event.id]?.click()}
                          >
                  <FaImage />
                            <span>Давайте оживим этот момент фотографиями</span>
                                            <input
                    ref={el => fileInputRefs.current[event.id] = el}
                              type="file" 
                              multiple 
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleFileSelect(event.id, e.target.files)}
                            />
                          </div>
                          
                          <div className={styles.eventCardFooter}>
                            <div className={styles.eventActions}>
                              <button 
                                className={styles.footerAction}
                                onClick={() => handleEditEvent(event.id)}
                              >
                                Изменить
                              </button>
                              <button 
                                className={styles.footerAction}
                                onClick={() => handleDuplicateEvent(event)}
                              >
                                Дублировать
                              </button>
                              <button 
                                className={styles.footerAction}
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                Удалить
                              </button>
                            </div>
                            <div className={styles.eventControls}>
                              {event.event_type === 'plan' && !event.completed && (
                                <button 
                                  className={styles.completeButton}
                                  onClick={() => handleCompleteEvent(event.id)}
                                >
                                  Отметить завершённым
                                </button>
                              )}
                              {event.completed && (
                                <span className={styles.completedBadge}>
                                  ✓ Завершено
                                </span>
                              )}
                            </div>
                </div>
              </div>
            );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>
      {}
      <input
        ref={el => fileInputRefs.current['bulk'] = el}
        type="file" 
        multiple 
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect('bulk', e.target.files)}
      />
      <StoryViewer
        date={date}
        isOpen={storyViewerOpen}
        onClose={closeStoryMode}
        onExport={handleExportDay}
        onShare={handleShareDay}
      />
      {}
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
export default DayDetailPage;
