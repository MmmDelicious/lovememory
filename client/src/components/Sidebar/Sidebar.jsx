import React, { useState, useEffect, useRef } from 'react';
import styles from './Sidebar.module.css';
import Button from '../Button/Button';
import eventService from '../../services/event.service';

const Sidebar = ({ isOpen, onClose, eventData, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (eventData) {
      setTitle(eventData.title || '');
      const currentDescription = eventData.extendedProps ? eventData.extendedProps.description : eventData.description;
      setDescription(currentDescription || '');
      
      if (eventData.id) {
        fetchMedia(eventData.id);
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
    onSave({ ...eventData, title, description });
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
  const formattedDate = new Date(eventData.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className={styles.overlay} onClick={onClose}></div>
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <h2 className={styles.title}>{formattedDate}</h2>
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.scrollableContent}>
            <label htmlFor="title">Название</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название события" className={styles.input} />
            <label htmlFor="description">Описание</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Добавьте описание..." className={styles.textarea} rows="5"></textarea>
            
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
          </div>
        </form>
      </div>
    </>
  );
};

export default Sidebar;