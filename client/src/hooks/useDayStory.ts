import { useState, useEffect, useCallback } from 'react';
import eventService from '../services/event.service';
import { format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from '../context/ToastContext';
interface EventData {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  event_type: string;
  location?: string;
  media: Array<{ id: string; file_url: string }>;
  isShared?: boolean;
  isImportant?: boolean;
  completed?: boolean;
  duration?: number;
}
interface StorySlide {
  type: 'cover' | 'timeHeader' | 'event' | 'media';
  [key: string]: any;
}
interface DayStoryData {
  date: string;
  events: EventData[];
  slides: StorySlide[];
  totalPhotos: number;
  totalDuration: number;
  daysTogetherCount: number;
}
const timeOfDayGroups = {
  morning: { label: 'Утро', range: [6, 12] },
  afternoon: { label: 'День', range: [12, 18] },
  evening: { label: 'Вечер', range: [18, 24] },
  night: { label: 'Ночь', range: [0, 6] }
};
const eventTypeDetails = {
  memory: { icon: '💭', label: 'Воспоминание', color: '#4a90e2' },
  plan: { icon: '📋', label: 'План', color: '#50e3c2' },
  anniversary: { icon: '💖', label: 'Годовщина', color: '#e91e63' },
  birthday: { icon: '🎂', label: 'День рождения', color: '#f5a623' },
  travel: { icon: '✈️', label: 'Путешествие', color: '#7ed321' },
  date: { icon: '🥂', label: 'Свидание', color: '#bd10e0' },
  gift: { icon: '🎁', label: 'Подарок', color: '#9013fe' },
  deadline: { icon: '⭐', label: 'Дедлайн', color: '#f8e71c' },
  default: { icon: '📅', label: 'Событие', color: '#8b572a' },
};
export const useDayStory = (relationshipStartDate = new Date('2023-01-01')) => {
  const [isLoading, setIsLoading] = useState(false);
  const [storyData, setStoryData] = useState<DayStoryData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'cccc, d MMMM yyyy', { locale: ru });
  }, []);
  const formatTime = useCallback((dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: ru });
  }, []);
  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ч ${mins > 0 ? mins + ' м' : ''}`.trim();
    }
    return `${mins} м`;
  }, []);
  const getTimeOfDay = useCallback((eventDate: string) => {
    const hour = new Date(eventDate).getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  }, []);
  const groupEventsByTimeOfDay = useCallback((events: EventData[]) => {
    const grouped = { morning: [], afternoon: [], evening: [], night: [] } as Record<string, EventData[]>;
    events.forEach(event => {
      const timeOfDay = getTimeOfDay(event.event_date);
      grouped[timeOfDay].push(event);
    });
    return grouped;
  }, [getTimeOfDay]);
  const calculateDaysTogetherCount = useCallback((date: string) => {
    const daysDiff = differenceInDays(new Date(date), relationshipStartDate);
    return Math.max(0, daysDiff);
  }, [relationshipStartDate]);
  const calculateSharedTime = useCallback((events: EventData[]) => {
    return events.reduce((total, event) => {
      if (event.duration) return total + event.duration;
      return total + 60; // Базовое время события - 1 час
    }, 0);
  }, []);
  const prepareStorySlides = useCallback((events: EventData[], date: string): StorySlide[] => {
    const slides: StorySlide[] = [];
    const totalPhotos = events.reduce((acc, e) => acc + e.media.length, 0);
    const totalDuration = calculateSharedTime(events);
    const daysTogetherCount = calculateDaysTogetherCount(date);
    slides.push({
      type: 'cover',
      title: formatDate(date),
      subtitle: `Наш день № ${daysTogetherCount} вместе`,
      stats: {
        events: events.length,
        photos: totalPhotos,
        timeSpent: formatDuration(totalDuration)
      }
    });
    events.forEach(event => {
      if (event.media.length === 0) return;
      const eventTypeData = eventTypeDetails[event.event_type] || eventTypeDetails.default;
      slides.push({
        type: 'event',
        event,
        eventIcon: eventTypeData.icon,
        eventLabel: eventTypeData.label,
        eventColor: eventTypeData.color,
        hasMedia: event.media.length > 0,
        mainImage: event.media[0]?.file_url
      });
      if (event.media.length > 1) {
        event.media.slice(1).forEach((media, index) => {
          slides.push({
            type: 'media',
            event,
            media,
            mediaIndex: index + 1,
            totalMedia: event.media.length
          });
        });
      }
    });
    return slides;
  }, [formatDate, formatDuration, calculateDaysTogetherCount, calculateSharedTime]);
  const loadDayStory = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const response = await eventService.getEvents();
      const dayEvents = response.data.filter((event: any) => 
        new Date(event.event_date).toISOString().split('T')[0] === date
      );
      if (dayEvents.length === 0) {
        toast.warning('В этот день нет событий для показа', 'Story mode');
        return null;
      }
      dayEvents.sort((a: any, b: any) => 
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      );
      const eventsWithMedia = await Promise.all(
        dayEvents.map(async (event: any) => {
          const mediaResponse = await eventService.getMediaForEvent(event.id);
          const validMedia = (mediaResponse.data || []).filter((media: any) => {
            const url = media.file_url || '';
            const isValidImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
            const hasValidName = !/^(утро|день|вечер|ночь|план|память|годовщина|путешествие)(\.(jpg|jpeg|png|gif|webp))?$/i.test(url.split('/').pop() || '');
            return isValidImage && hasValidName && url.includes('/uploads/');
          });
          return { 
            ...event, 
            media: validMedia
          };
        })
      );
      const totalPhotos = eventsWithMedia.reduce((acc, e) => acc + e.media.length, 0);
      if (totalPhotos === 0) {
        toast.warning('В этот день нет фотографий для показа', 'Story mode');
        return null;
      }
      const slides = prepareStorySlides(eventsWithMedia, date);
      const totalDuration = calculateSharedTime(eventsWithMedia);
      const daysTogetherCount = calculateDaysTogetherCount(date);
      const dayStoryData: DayStoryData = {
        date,
        events: eventsWithMedia,
        slides,
        totalPhotos,
        totalDuration,
        daysTogetherCount
      };
      setStoryData(dayStoryData);
      setCurrentSlideIndex(0);
      setProgress(0);
      return dayStoryData;
    } catch (error) {
      console.error('Error loading day story:', error);
      toast.error('Не удалось загрузить историю дня', 'Ошибка');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [prepareStorySlides, calculateSharedTime, calculateDaysTogetherCount]);
  const startStory = useCallback(() => {
    setIsPlaying(true);
    setProgress(0);
  }, []);
  const pauseStory = useCallback(() => {
    setIsPlaying(false);
  }, []);
  const nextSlide = useCallback(() => {
    if (!storyData) return;
    if (currentSlideIndex < storyData.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
      setProgress(0);
    } else {
      setIsPlaying(false);
      return 'end';
    }
  }, [storyData, currentSlideIndex]);
  const prevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentSlideIndex]);
  const goToSlide = useCallback((index: number) => {
    if (!storyData || index < 0 || index >= storyData.slides.length) return;
    setCurrentSlideIndex(index);
    setProgress(0);
  }, [storyData]);
  const closeStory = useCallback(() => {
    setIsPlaying(false);
    setStoryData(null);
    setCurrentSlideIndex(0);
    setProgress(0);
  }, []);
  useEffect(() => {
    if (!isPlaying || !storyData) return;
    const storyDuration = 4000; // 4 секунды на слайд
    const progressInterval = 100;
    const progressStep = (progressInterval / storyDuration) * 100;
    let animationFrameId: number;
    const updateProgress = () => {
      setProgress(prev => {
        if (prev >= 100) {
          const result = nextSlide();
          if (result === 'end') {
            return 100;
          }
          return 0;
        }
        return Math.min(100, prev + progressStep);
      });
    };
    const interval = setInterval(() => {
      animationFrameId = requestAnimationFrame(updateProgress);
    }, progressInterval);
    return () => {
      clearInterval(interval);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, storyData, currentSlideIndex, nextSlide]);
  const setEventAsDayCover = useCallback(async (eventId: string, mediaId?: string) => {
    try {
      await eventService.setDayCover(eventId, mediaId);
      toast.success('Событие назначено обложкой дня!', 'Готово');
    } catch (error) {
      console.error('Error setting day cover:', error);
      toast.error('Не удалось назначить обложку', 'Ошибка');
    }
  }, []);
  return {
    storyData,
    currentSlide: storyData?.slides[currentSlideIndex] || null,
    currentSlideIndex,
    totalSlides: storyData?.slides.length || 0,
    isLoading,
    isPlaying,
    progress,
    loadDayStory,
    startStory,
    pauseStory,
    nextSlide,
    prevSlide,
    goToSlide,
    closeStory,
    setEventAsDayCover,
    setStoryData,
    setCurrentSlideIndex,
    setProgress,
    formatDate,
    formatTime,
    formatDuration
  };
};
export default useDayStory;

