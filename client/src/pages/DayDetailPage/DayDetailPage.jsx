import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import eventService from '../../services/event.service';
import styles from './DayDetailPage.module.css';

import Button from '../../components/Button/Button';
import { FaCalendarPlus, FaImage, FaHeart, FaBirthdayCake, FaPlane, FaGift, FaStar, FaCommentDots, FaCalendarCheck, FaGlassCheers, FaUsers } from 'react-icons/fa';

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
  const fileInputRefs = useRef({});

  const fetchDayEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvents();
      const dayEvents = response.data.filter(event => new Date(event.event_date).toISOString().split('T')[0] === date);
      dayEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      
          const eventsWithMedia = await Promise.all(
        dayEvents.map(async (event) => {
          const mediaResponse = await eventService.getMediaForEvent(event.id);
          return { ...event, media: mediaResponse.data || [] };
        })
      );
      
      setEvents(eventsWithMedia);
    } catch (err) {
      setError('Не удалось загрузить события дня');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayEvents();
  }, [date]);

  const formatDate = (dateString) => format(new Date(dateString), 'd MMMM yyyy', { locale: ru });
  const formatTime = (dateString) => format(new Date(dateString), 'HH:mm', { locale: ru });

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
    } catch (error) {
      alert('Не удалось переместить фотографию');
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
    } catch (error) {
      alert('Не удалось загрузить файлы');
    } finally {
      setUploadingMedia(prev => ({ ...prev, [eventId]: false }));
    }
  };

  if (loading) return <div className={styles.pageStateContainer}><div className={styles.loadingSpinner}></div></div>;
  if (error) return <div className={styles.pageStateContainer}><p>{error}</p></div>;

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{formatDate(date)}</h1>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>Назад к календарю</Button>
      </header>

      <main className={styles.eventFeed}>
        {events.length === 0 ? (
          <div className={`${styles.card} ${styles.emptyState}`}>
            <FaCalendarPlus className={styles.emptyIcon} />
            <h2>В этот день нет событий</h2>
            <Button onClick={() => navigate('/dashboard')}>Добавить событие</Button>
          </div>
        ) : (
          events.map(event => {
            const { icon: Icon, label, color } = eventTypeDetails[event.event_type] || eventTypeDetails.default;
            return (
              <div key={event.id} className={styles.card}>
                <div className={styles.eventInfo}>
                  <div className={styles.eventHeader}>
                    <span className={styles.eventTime}>{formatTime(event.event_date)}</span>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                  </div>
                  <div className={styles.eventMeta}>
                    <span className={styles.eventType} style={{ color, borderColor: color, backgroundColor: `${color}20` }}>
                      <Icon /> {label}
                    </span>
                    {event.isShared && <span className={styles.sharedBadge}><FaUsers /> Общее событие</span>}
                  </div>
                  {event.description && <p className={styles.eventDescription}>{event.description}</p>}
                </div>

                <div
                  className={`${styles.mediaSection} ${dragOverEvent === event.id ? styles.dragOver : ''}`}
                  onDragOver={(e) => handleDragOver(e, event.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, event.id)}
                >
                  <div className={styles.mediaGrid}>
                    {event.media.map(media => (
                      <div
                        key={media.id}
                        className={`${styles.mediaItem} ${draggedMedia?.id === media.id ? styles.dragging : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, media, event.id)}
                        onClick={() => setSelectedImage(`${eventService.FILES_BASE_URL}${media.file_url}`)}
                      >
                        <img src={`${eventService.FILES_BASE_URL}${media.file_url}`} alt="" className={styles.mediaImage} />
                      </div>
                    ))}
                  </div>

                  {event.media.length === 0 && (
                    <div className={styles.dropHint}>
                      Перетащите фото сюда
                    </div>
                  )}

                  {uploadingMedia[event.id] && <div className={styles.uploadingIndicator}>Загрузка...</div>}
                </div>

                <div className={styles.addMediaPlaceholder} onClick={() => fileInputRefs.current[event.id]?.click()}>
                  <FaImage />
                  <span>Добавить фото</span>
                  <input
                    ref={el => fileInputRefs.current[event.id] = el}
                    type="file" multiple accept="image/*" style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(event.id, e.target.files)}
                  />
                </div>
              </div>
            );
          })
        )}
      </main>

      {selectedImage && (
        <div className={styles.imageModal} onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Просмотр" className={styles.fullSizeImage} onClick={(e) => e.stopPropagation()} />
          <button className={styles.closeModalButton} onClick={() => setSelectedImage(null)}>×</button>
        </div>
      )}
    </div>
  );
};

export default DayDetailPage;