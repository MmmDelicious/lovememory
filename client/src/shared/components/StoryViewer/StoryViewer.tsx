import React, { useEffect, useCallback, useRef } from 'react';
import { FaPlay, FaPause, FaMapMarkerAlt } from 'react-icons/fa';
import eventService from '../../../modules/events/services/event.service';
import Button from '../Button/Button';
import useDayStory from '../../../modules/events/hooks/useDayStory';
import styles from './StoryViewer.module.css';
interface StoryViewerProps {
  date?: string;
  memoryData?: any;
  isOpen: boolean;
  onClose: () => void;
}
const StoryViewer: React.FC<StoryViewerProps> = ({
  date,
  memoryData,
  isOpen,
  onClose
}) => {
  const {
    storyData,
    currentSlide,
    currentSlideIndex,
    totalSlides,
    isLoading,
    isPlaying,
    progress,
    loadDayStory,
    startStory,
    pauseStory,
    nextSlide,
    prevSlide,
    closeStory,
    setEventAsDayCover,
    setStoryData,
    setCurrentSlideIndex,
    setProgress,
    formatDate,
    formatTime
  } = useDayStory();
  const isOpenRef = useRef(isOpen);
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);
  useEffect(() => {
    if (isOpen && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      if (memoryData) {
        const memoryStoryData = {
          date: memoryData.dateRange,
          events: memoryData.slides.filter((s: any) => s.type === 'memoryEvent').map((s: any) => s.event),
          slides: memoryData.slides,
          totalPhotos: memoryData.totalMedia,
          totalDuration: 0,
          daysTogetherCount: 0,
          isMemory: true
        };
        setStoryData(memoryStoryData);
        setCurrentSlideIndex(0);
        setProgress(0);
        setTimeout(() => {
          if (isOpenRef.current) {
            startStory();
          }
        }, 300);
      } else if (date) {
        loadDayStory(date).then((data) => {
          if (data && isOpenRef.current) {
            setTimeout(() => {
              if (isOpenRef.current) {
                startStory();
              }
            }, 300);
          }
        });
      }
    } else if (!isOpen && hasLoadedRef.current) {
      hasLoadedRef.current = false;
      closeStory();
    }
  }, [isOpen, date, memoryData, loadDayStory, startStory, closeStory, setStoryData, setCurrentSlideIndex, setProgress]);
  const handleClose = useCallback(() => {
    closeStory();
    onClose();
  }, [closeStory, onClose]);
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || 
          (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevSlide();
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          isPlaying ? pauseStory() : startStory();
          break;
      }
    };
    document.addEventListener('keydown', handleKeyPress, { passive: false });
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, isPlaying, nextSlide, prevSlide, handleClose, pauseStory, startStory]);
  const renderStorySlide = useCallback((slide: any) => {
    if (!slide) return null;
    switch (slide.type) {
      case 'cover':
        return (
          <div className={styles.storyCover}>
            <div className={styles.storyCoverContent}>
              <h1 className={styles.storyCoverTitle}>{slide.title}</h1>
              <p className={styles.storyCoverSubtitle}>{slide.subtitle}</p>
              <div className={styles.storyCoverStats}>
                <div className={styles.storyStat}>
                  <span className={styles.storyStatNumber}>{slide.stats.events}</span>
                  <span className={styles.storyStatLabel}>событий</span>
                </div>
                <div className={styles.storyStat}>
                  <span className={styles.storyStatNumber}>{slide.stats.photos}</span>
                  <span className={styles.storyStatLabel}>фото</span>
                </div>
                <div className={styles.storyStat}>
                  <span className={styles.storyStatNumber}>{slide.stats.timeSpent}</span>
                  <span className={styles.storyStatLabel}>времени</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'memoryCover':
        return (
          <div className={styles.storyCover}>
            <div className={styles.storyCoverContent}>
              <h1 className={styles.storyCoverTitle}>{slide.title}</h1>
              <p className={styles.storyCoverSubtitle}>{slide.subtitle}</p>
              <div className={styles.storyCoverStats}>
                <div className={styles.storyStat}>
                  <span className={styles.storyStatNumber}>{slide.stats.events}</span>
                  <span className={styles.storyStatLabel}>событий</span>
                </div>
                <div className={styles.storyStat}>
                  <span className={styles.storyStatNumber}>{slide.stats.photos}</span>
                  <span className={styles.storyStatLabel}>фото</span>
                </div>
                <div className={styles.storyStat}>
                  <span className={styles.storyStatNumber}>{slide.stats.period}</span>
                  <span className={styles.storyStatLabel}>из прошлого</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'event':
        return (
          <div className={styles.storyEvent}>
            {slide.mainImage && slide.hasMedia && (
              <div className={styles.storyEventImage}>
                <img 
                  src={`${eventService.FILES_BASE_URL}${slide.mainImage}`} 
                  alt={slide.event.title}
                  loading="lazy"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className={styles.storyEventContent}>
              <div className={styles.storyEventHeader}>
                <div 
                  className={styles.storyEventTypeIcon}
                  style={{ backgroundColor: `${slide.eventColor}20`, color: slide.eventColor }}
                >
                  {slide.eventIcon}
                </div>
                <div className={styles.storyEventInfo}>
                  <span className={styles.storyEventType}>{slide.eventLabel}</span>
                  <span className={styles.storyEventTime}>
                    {formatTime(slide.event.event_date)}
                  </span>
                </div>
              </div>
              <h3 className={styles.storyEventTitle}>{slide.event.title}</h3>
              {slide.event.description && (
                <p className={styles.storyEventDescription}>
                  {slide.event.description.length > 120 
                    ? `${slide.event.description.substring(0, 120)}...`
                    : slide.event.description
                  }
                </p>
              )}
              {slide.event.location && (
                <div className={styles.storyEventLocation}>
                  <FaMapMarkerAlt />
                  <span>{slide.event.location}</span>
                </div>
              )}
              {slide.hasMedia && slide.mainImage && (
                <button 
                  className={styles.setCoverButton}
                  onClick={() => setEventAsDayCover(slide.event.id, slide.mainImage?.split('/').pop())}
                >
                  🖼️ Сделать обложкой дня
                </button>
              )}
            </div>
          </div>
        );
      case 'media':
        return (
          <div className={styles.storyMedia}>
            <img 
              src={`${eventService.FILES_BASE_URL}${slide.media.file_url}`}
              alt=""
              className={styles.storyMediaImage}
              loading="lazy"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
            <div className={styles.storyMediaCaption}>
              <h4>{slide.event.title}</h4>
              <span className={styles.storyMediaCounter}>
                {slide.mediaIndex + 1} / {slide.totalMedia}
              </span>
            </div>
            <button 
              className={styles.setCoverButton}
              onClick={() => setEventAsDayCover(slide.event.id, slide.media.id)}
            >
              🖼️ Сделать обложкой дня
            </button>
          </div>
        );
      case 'dayHeader':
        return (
          <div className={styles.storyDayHeader}>
            <div className={styles.storyDayHeaderContent}>
              <h2 className={styles.storyDayTitle}>{slide.date}</h2>
              <p className={styles.storyDaySubtitle}>{slide.timeAgo}</p>
              <div className={styles.storyDayStats}>
                <span>{slide.eventsCount} {slide.eventsCount === 1 ? 'событие' : 'событий'}</span>
              </div>
            </div>
          </div>
        );
      case 'memoryEvent':
        return (
          <div className={styles.storyEvent}>
            {slide.mainImage && slide.hasMedia && (
              <div className={styles.storyEventImage}>
                <img 
                  src={`${eventService.FILES_BASE_URL}${slide.mainImage}`} 
                  alt={slide.event.title}
                  loading="lazy"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className={styles.storyEventContent}>
              <div className={styles.storyEventHeader}>
                <div 
                  className={styles.storyEventTypeIcon}
                  style={{ backgroundColor: '#ff6b6b20', color: '#ff6b6b' }}
                >
                  💭
                </div>
                <div className={styles.storyEventInfo}>
                  <span className={styles.storyEventType}>Воспоминание</span>
                  <span className={styles.storyEventTime}>
                    {slide.timeAgo}
                  </span>
                </div>
              </div>
              <h3 className={styles.storyEventTitle}>{slide.event.title}</h3>
              <p className={styles.storyEventDate}>{slide.date}</p>
              {slide.event.description && (
                <p className={styles.storyEventDescription}>
                  {slide.event.description.length > 120 
                    ? `${slide.event.description.substring(0, 120)}...`
                    : slide.event.description
                  }
                </p>
              )}
              {slide.event.location && (
                <div className={styles.storyEventLocation}>
                  <FaMapMarkerAlt />
                  <span>{slide.event.location}</span>
                </div>
              )}
            </div>
          </div>
        );
      case 'memoryMedia':
        return (
          <div className={styles.storyMedia}>
            <img 
              src={`${eventService.FILES_BASE_URL}${slide.media.file_url}`}
              alt=""
              className={styles.storyMediaImage}
              loading="lazy"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
              }}
            />
            <div className={styles.storyMediaCaption}>
              <h4>{slide.event.title}</h4>
              <span className={styles.storyMediaDate}>{slide.date}</span>
              <span className={styles.storyMediaCounter}>
                {slide.mediaIndex + 1} / {slide.totalMedia}
              </span>
            </div>
          </div>
        );
      default:
        return (
          <div className={styles.storyDefault}>
            <p>Неизвестный тип слайда</p>
          </div>
        );
    }
  }, [formatTime, setEventAsDayCover]);
  if (!isOpen) return null;
  if (isLoading) {
    return (
      <div className={styles.storyModal}>
        <div className={styles.storyViewer}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Подготавливаем историю дня...</p>
          </div>
        </div>
      </div>
    );
  }
  if (!storyData || totalSlides === 0) {
    return (
      <div className={styles.storyModal} onClick={handleClose}>
        <div className={styles.storyViewer}>
          <div className={styles.emptyState}>
            <p>В этот день нет событий для показа</p>
            <Button onClick={handleClose}>Закрыть</Button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.storyModal} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.storyViewer}>
        {}
        <div className={styles.storyProgressBars}>
          {storyData.slides.map((_, index) => (
            <div key={index} className={styles.storyProgressBar}>
              <div 
                className={styles.storyProgressFill}
                style={{
                  width: index < currentSlideIndex ? '100%' : 
                         index === currentSlideIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>
        {}
        <div className={styles.storyViewerHeader}>
          <div className={styles.storyInfo}>
            <span className={styles.storyCounter}>
              {currentSlideIndex + 1} / {totalSlides}
            </span>
            <div className={styles.storyDateInfo}>
              <h3>{memoryData ? memoryData.dateRange : (date ? formatDate(date) : '')}</h3>
              <p>{memoryData ? 'Воспоминания из прошлого' : `Наш день № ${storyData.daysTogetherCount} вместе`}</p>
            </div>
          </div>
          <div className={styles.storyActions}>
            <button 
              className={styles.storyPlayButton}
              onClick={isPlaying ? pauseStory : startStory}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button className={styles.storyCloseButton} onClick={handleClose}>
              ×
            </button>
          </div>
        </div>
        {}
        <div className={styles.storySlideContainer}>
          {renderStorySlide(currentSlide)}
        </div>
        {}
        <div className={styles.storyNavigation}>
          <div 
            className={styles.storyNavPrev}
            onClick={prevSlide}
          />
          <div 
            className={styles.storyNavNext}
            onClick={nextSlide}
          />
        </div>
        {}
      </div>
    </div>
  );
};
export default StoryViewer;

