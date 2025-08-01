import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import eventService from '../../services/event.service';
import styles from './DayDetailPage.module.css';

const DayDetailPage = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [draggedMedia, setDraggedMedia] = useState(null);
  const [dragOverEvent, setDragOverEvent] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState({});
  const fileInputRefs = useRef({});

  useEffect(() => {
    fetchDayEvents();
  }, [date]);

  const fetchDayEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvents();
      const dayEvents = response.data.filter(event => {
        const eventDate = new Date(event.event_date).toISOString().split('T')[0];
        return eventDate === date;
      });
      
      // Сортируем события по времени
      dayEvents.sort((a, b) => {
        const timeA = new Date(a.event_date).getTime();
        const timeB = new Date(b.event_date).getTime();
        return timeA - timeB;
      });
      
      // Загружаем медиа для каждого события
      const eventsWithMedia = await Promise.all(
        dayEvents.map(async (event) => {
          try {
            const mediaResponse = await eventService.getMediaForEvent(event.id);
            return {
              ...event,
              media: mediaResponse.data || []
            };
          } catch (error) {
            console.error(`Error loading media for event ${event.id}:`, error);
            return {
              ...event,
              media: []
            };
          }
        })
      );
      
      setEvents(eventsWithMedia);
    } catch (err) {
      setError('Не удалось загрузить события дня');
      console.error('Error fetching day events:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), 'HH:mm', { locale: ru });
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'd MMMM yyyy', { locale: ru });
  };

  const getEventTypeIcon = (eventType) => {
    const icons = {
      memory: '💭',
      plan: '📅',
      anniversary: '💕',
      birthday: '🎂',
      travel: '✈️',
      date: '💖',
      gift: '🎁',
      milestone: '⭐'
    };
    return icons[eventType] || '📅';
  };

  const getEventTypeLabel = (eventType) => {
    const labels = {
      memory: 'Воспоминания',
      plan: 'Планы',
      anniversary: 'Годовщины',
      birthday: 'Дни рождения',
      travel: 'Путешествия',
      date: 'Свидания',
      gift: 'Подарки',
      milestone: 'Важные моменты'
    };
    return labels[eventType] || 'Событие';
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  // Drag & Drop функции
  const handleDragStart = (e, media, sourceEventId) => {
    setDraggedMedia({ ...media, sourceEventId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ media, sourceEventId }));
  };

  const handleDragOver = (e, eventId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverEvent(eventId);
  };

  const handleDragLeave = () => {
    setDragOverEvent(null);
  };

  const handleDrop = async (e, targetEventId) => {
    e.preventDefault();
    setDragOverEvent(null);
    
    if (!draggedMedia || draggedMedia.sourceEventId === targetEventId) {
      setDraggedMedia(null);
      return;
    }

    try {
      // Перемещаем медиа между событиями
      await eventService.moveMediaToEvent(draggedMedia.id, targetEventId);
      
      // Обновляем локальное состояние
      setEvents(prevEvents => {
        const newEvents = [...prevEvents];
        
        // Удаляем из исходного события
        const sourceEventIndex = newEvents.findIndex(e => e.id === draggedMedia.sourceEventId);
        if (sourceEventIndex !== -1) {
          newEvents[sourceEventIndex] = {
            ...newEvents[sourceEventIndex],
            media: newEvents[sourceEventIndex].media.filter(m => m.id !== draggedMedia.id)
          };
        }
        
        // Добавляем в целевое событие
        const targetEventIndex = newEvents.findIndex(e => e.id === targetEventId);
        if (targetEventIndex !== -1) {
          newEvents[targetEventIndex] = {
            ...newEvents[targetEventIndex],
            media: [...newEvents[targetEventIndex].media, draggedMedia]
          };
        }
        
        return newEvents;
      });
      
      setDraggedMedia(null);
    } catch (error) {
      console.error('Error moving media:', error);
      alert('Не удалось переместить фотографию');
      setDraggedMedia(null);
    }
  };

  // Функции для загрузки файлов
  const handleFileSelect = async (eventId, files) => {
    if (!files || files.length === 0) return;

    setUploadingMedia(prev => ({ ...prev, [eventId]: true }));

    try {
      for (const file of files) {
        await eventService.uploadFile(eventId, file);
      }
      
      // Обновляем события с новыми медиа
      await fetchDayEvents();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Не удалось загрузить файлы');
    } finally {
      setUploadingMedia(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleAddMediaClick = (eventId) => {
    if (fileInputRefs.current[eventId]) {
      fileInputRefs.current[eventId].click();
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Загрузка событий дня...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')} className={styles.backButton}>
          Вернуться к календарю
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/dashboard')} className={styles.backButton}>
          ← Назад к календарю
        </button>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>LoveMemory</h1>
          <h2 className={styles.date}>{formatDate(date)}</h2>
        </div>
      </div>

      <div className={styles.content}>
        {events.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <h3>В этот день нет событий</h3>
            <p>Добавьте воспоминания или планы, чтобы сделать этот день особенным</p>
            <button 
              onClick={() => navigate('/dashboard')} 
              className={styles.addEventButton}
            >
              Добавить событие
            </button>
          </div>
        ) : (
          <div className={styles.timeline}>
            {events.map((event, index) => (
              <div key={event.id} className={styles.timelineItem}>
                <div className={styles.timeSection}>
                  <div className={styles.time}>{formatTime(event.event_date)}</div>
                  <div className={styles.eventType}>
                    <span className={styles.eventIcon}>
                      {getEventTypeIcon(event.event_type)}
                    </span>
                    <span>{getEventTypeLabel(event.event_type)}</span>
                  </div>
                </div>
                
                <div 
                  className={`${styles.eventContent} ${dragOverEvent === event.id ? styles.dragOver : ''}`}
                  onDragOver={(e) => handleDragOver(e, event.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, event.id)}
                >
                  <div className={styles.eventHeader}>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    <div className={styles.eventActions}>
                      {event.isShared && (
                        <span className={styles.sharedBadge}>👥 Общее</span>
                      )}
                      <button 
                        className={styles.addMediaButton}
                        onClick={() => handleAddMediaClick(event.id)}
                        title="Добавить фотографии"
                      >
                        📷
                      </button>
                    </div>
                  </div>
                  
                  {event.description && (
                    <p className={styles.eventDescription}>{event.description}</p>
                  )}
                  
                  <div className={styles.mediaSection}>
                    {event.media && event.media.length > 0 && (
                      <div className={styles.mediaGrid}>
                        {event.media.map((media, mediaIndex) => (
                          <div 
                            key={media.id} 
                            className={`${styles.mediaItem} ${draggedMedia?.id === media.id ? styles.dragging : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, media, event.id)}
                            onClick={() => openImageModal(`${eventService.API_BASE_URL}${media.file_url}`)}
                          >
                            <img 
                              src={`${eventService.API_BASE_URL}${media.file_url}`} 
                              alt={`Фото ${mediaIndex + 1}`}
                              className={styles.mediaImage}
                            />
                            <div className={styles.dragHandle}>↕️</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {uploadingMedia[event.id] && (
                      <div className={styles.uploadingIndicator}>
                        <div className={styles.uploadingSpinner}></div>
                        <span>Загрузка...</span>
                      </div>
                    )}
                    
                    {(!event.media || event.media.length === 0) && !uploadingMedia[event.id] && (
                      <div className={styles.emptyMediaSection}>
                        <p>Нет фотографий</p>
                        <button 
                          className={styles.addMediaButton}
                          onClick={() => handleAddMediaClick(event.id)}
                        >
                          📷 Добавить фото
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Скрытый input для загрузки файлов */}
                  <input
                    ref={(el) => fileInputRefs.current[event.id] = el}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(event.id, e.target.files)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно для просмотра изображений */}
      {imageModalOpen && (
        <div className={styles.imageModal} onClick={closeImageModal}>
          <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModalButton} onClick={closeImageModal}>×</button>
            <img 
              src={selectedImage} 
              alt="Фото в полном размере" 
              className={styles.fullSizeImage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DayDetailPage; 