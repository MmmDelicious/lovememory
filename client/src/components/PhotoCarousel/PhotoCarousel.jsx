import React, { useState, useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus, FaTimes, FaExpand } from 'react-icons/fa';
import eventService from '../../services/event.service';
import styles from './PhotoCarousel.module.css';

const PhotoCarousel = ({ photos, onPhotosUpdate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const carouselRef = useRef(null);

  const handlePrevious = () => {
    setCurrentIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Находим событие для загрузки фото
    // Если есть события дня, берем первое, иначе создаем новое
    if (photos.length > 0) {
      const firstEventId = photos[0].eventId;
      await uploadPhoto(file, firstEventId);
    } else {
      // Можно показать модал выбора события или создать новое
      console.log('No events found for this day');
    }
  };

  const uploadPhoto = async (file, eventId) => {
    try {
      setIsUploading(true);
      await eventService.uploadFile(eventId, file);
      onPhotosUpdate?.();
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') handlePrevious();
    if (event.key === 'ArrowRight') handleNext();
    if (event.key === 'Escape') closeFullscreen();
  };

  // Touch handlers for mobile swipe
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrevious();
  };

  if (photos.length === 0) {
    return (
      <div className={styles.emptyCarousel}>
        <div className={styles.emptyContent}>
          <FaPlus className={styles.emptyIcon} />
          <p>Фотографий пока нет</p>
          <button 
            className={styles.uploadButton}
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? 'Загружается...' : 'Добавить фото'}
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
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <>
      <div className={styles.carousel} ref={carouselRef}>
        <div className={styles.carouselContainer}>
          {/* Main Photo */}
          <div 
            className={styles.photoContainer}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={`${eventService.API_BASE_URL}${currentPhoto.file_url}`}
              alt="Memory"
              className={styles.mainPhoto}
            />
            
            {/* Controls */}
            <div className={styles.controls}>
              {photos.length > 1 && (
                <>
                  <button className={styles.navButton} onClick={handlePrevious}>
                    <FaChevronLeft />
                  </button>
                  <button className={styles.navButton} onClick={handleNext}>
                    <FaChevronRight />
                  </button>
                </>
              )}
              <button className={styles.actionButton} onClick={handleFullscreen}>
                <FaExpand />
              </button>
            </div>

            {/* Photo Info */}
            <div className={styles.photoInfo}>
              <p className={styles.eventTitle}>{currentPhoto.eventTitle}</p>
              <p className={styles.photoCounter}>
                {currentIndex + 1} из {photos.length}
              </p>
            </div>
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className={styles.thumbnails}>
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`${styles.thumbnail} ${index === currentIndex ? styles.active : ''}`}
                  onClick={() => setCurrentIndex(index)}
                >
                  <img
                    src={`${eventService.API_BASE_URL}${photo.file_url}`}
                    alt={`Thumbnail ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button 
          className={styles.uploadButtonFixed}
          onClick={handleUpload}
          disabled={isUploading}
          title="Добавить фото"
        >
          <FaPlus />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="image/*"
        />
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className={styles.fullscreenModal}
          onClick={closeFullscreen}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className={styles.fullscreenContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeFullscreen}>
              <FaTimes />
            </button>
            
            <img
              src={`${eventService.API_BASE_URL}${currentPhoto.file_url}`}
              alt="Memory"
              className={styles.fullscreenPhoto}
            />
            
            {photos.length > 1 && (
              <div className={styles.fullscreenControls}>
                <button className={styles.fullscreenNavButton} onClick={handlePrevious}>
                  <FaChevronLeft />
                </button>
                <span className={styles.fullscreenCounter}>
                  {currentIndex + 1} / {photos.length}
                </span>
                <button className={styles.fullscreenNavButton} onClick={handleNext}>
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoCarousel; 