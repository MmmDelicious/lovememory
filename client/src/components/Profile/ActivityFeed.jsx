import React, { useState, useEffect, memo, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Link } from 'react-router-dom';
import Button from '../Button/Button';
import styles from './ActivityFeed.module.css';
import { FaPlus, FaPencilAlt, FaTrash } from 'react-icons/fa';
import { eventService } from '../../services';
const ActivityFeed = memo(({ events, areEventsLoading, deleteEvent }) => {
  const isCompact = useMediaQuery({ maxWidth: 480 });
  const [activeTab, setActiveTab] = useState('events');
  const [galleryItems, setGalleryItems] = useState([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  };
  const fetchGallery = useCallback(async () => {
    if (!events || !events.length) {
      setGalleryItems([]);
      return;
    }
    setIsGalleryLoading(true);
    try {
      const eventsToLoad = [...events].sort((a, b) => new Date(b.start) - new Date(a.start)).slice(0, 20);
      const mediaArrays = await Promise.all(
        eventsToLoad.map((ev) => eventService.getMediaForEvent(ev.id).then(r => r.data).catch(() => []))
      );
      setGalleryItems(mediaArrays.flat());
    } catch (err) {
      console.error('Failed to load gallery:', err);
      setGalleryItems([]);
    } finally {
      setIsGalleryLoading(false);
    }
  }, [events]);
  useEffect(() => {
    if (activeTab === 'gallery') {
      fetchGallery();
    }
  }, [activeTab, fetchGallery]);
  const renderEvents = () => {
    if (areEventsLoading) return <div className={styles.placeholder}>Загрузка событий...</div>;
    const upcomingEvents = events?.filter(event => new Date(event.start) >= new Date()).sort((a, b) => new Date(a.start) - new Date(b.start));
    if (!upcomingEvents || upcomingEvents.length === 0) return <div className={styles.placeholder}>Нет предстоящих дел.</div>;
    return (
      <div className={styles.list}>
        {upcomingEvents.map(event => (
          <div key={event.id} className={styles.eventItem}>
            <div className={styles.eventIndicator}></div>
            <div className={styles.eventDateIcon}><span>{new Date(event.start).getDate()}</span></div>
            <div className={styles.eventContent}>
              <div className={styles.eventTitle}>{event.title}</div>
              <div className={styles.eventDescription}>{event.extendedProps?.description || 'Описание отсутствует'}</div>
              <div className={styles.eventMeta}>{formatDate(event.start)}</div>
            </div>
            <div className={styles.eventActions}>
              <Link to="/dashboard" className={styles.iconBtn} aria-label="Edit in calendar"><FaPencilAlt /></Link>
              <button className={styles.iconBtn} onClick={() => deleteEvent(event.id)} aria-label="Delete event"><FaTrash /></button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  const renderGallery = () => {
    if (isGalleryLoading) return <div className={styles.placeholder}>Загрузка галереи...</div>;
    if (!galleryItems.length) return <div className={styles.placeholder}>Медиа не найдено.</div>;
    return (
      <div className={styles.galleryGrid}>
        {galleryItems.map((item) => (
          <div key={item.id} className={styles.galleryItem}>
            <img src={`${eventService.FILES_BASE_URL}${item.file_url}`} alt={item.file_type} loading="lazy" />
          </div>
        ))}
      </div>
    );
  };
  return (
    <div className={`${styles.feedWrapper} ${isCompact ? styles.compact : ''}`}>
      <div className={styles.tabs}>
        <div className={`${styles.tab} ${activeTab === 'events' ? styles.active : ''}`} onClick={() => setActiveTab('events')}>Предстоящие дела</div>
        <div className={`${styles.tab} ${activeTab === 'gallery' ? styles.active : ''}`} onClick={() => setActiveTab('gallery')}>Галерея</div>
      </div>
      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <h3>{activeTab === 'events' ? `Задачи (${events?.length || 0})` : 'Галерея'}</h3>
          <Link to="/dashboard">
            <Button type="outline" size="sm"><FaPlus /> Добавить</Button>
          </Link>
        </div>
        {activeTab === 'events' ? renderEvents() : renderGallery()}
      </div>
    </div>
  );
});
ActivityFeed.displayName = 'ActivityFeed';
export default ActivityFeed;
