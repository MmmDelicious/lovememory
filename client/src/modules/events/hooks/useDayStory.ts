import { useState, useCallback, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import eventService from '../services/event.service';
import { toast } from '../context/ToastContext';

interface StorySlide {
  type: 'dayHeader' | 'event' | 'media';
  event?: any;
  media?: any;
  mediaIndex?: number;
  totalMedia?: number;
  date?: string;
  timeAgo?: string;
  eventsCount?: number;
  hasMedia?: boolean;
  mainImage?: string;
}

interface StoryData {
  date: string;
  events: any[];
  slides: StorySlide[];
  totalPhotos: number;
  totalDuration: number;
  daysTogetherCount: number;
  isMemory?: boolean;
}

const useDayStory = () => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const slideDuration = 3000; // 3 seconds per slide

  const currentSlide = storyData?.slides[currentSlideIndex] || null;
  const totalSlides = storyData?.slides.length || 0;

  const formatDate = useCallback((dateStr: string) => {
    return format(new Date(dateStr), 'cccc, d MMMM yyyy', { locale: ru });
  }, []);

  const formatTime = useCallback((dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm', { locale: ru });
  }, []);

  const createStorySlides = useCallback((events: any[], date: string): StorySlide[] => {
    const slides: StorySlide[] = [];
    
    // Add day header
    slides.push({
      type: 'dayHeader',
      date: formatDate(date),
      eventsCount: events.length,
      timeAgo: 'Сегодня'
    });

    // Add event slides
    events.forEach(event => {
      // Add main event slide
      slides.push({
        type: 'event',
        event,
        date: formatDate(event.event_date),
        hasMedia: event.media && event.media.length > 0,
        mainImage: event.media?.[0]?.file_url
      });

      // Add media slides
      if (event.media && event.media.length > 0) {
        event.media.forEach((media: any, index: number) => {
          slides.push({
            type: 'media',
            event,
            media,
            mediaIndex: index,
            totalMedia: event.media.length,
            date: formatDate(event.event_date)
          });
        });
      }
    });

    return slides;
  }, [formatDate]);

  const loadDayStory = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const response = await eventService.getEvents();
      const allEvents = response.data;
      
      // Filter events for the specific date
      const dayEvents = allEvents.filter((event: any) => 
        event.event_date.split('T')[0] === date
      );

      if (dayEvents.length === 0) {
        toast.warning('В этот день нет событий для показа');
        setIsLoading(false);
        return null;
      }

      // Load media for events
      const eventsWithMedia = await Promise.all(
        dayEvents.map(async (event: any) => {
          try {
            const mediaResponse = await eventService.getMediaForEvent(event.id);
            return {
              ...event,
              media: mediaResponse.data || []
            };
          } catch (error) {
            console.error('Error loading media for event:', event.id, error);
            return {
              ...event,
              media: []
            };
          }
        })
      );

      const slides = createStorySlides(eventsWithMedia, date);
      const totalPhotos = eventsWithMedia.reduce((sum: number, event: any) => 
        sum + (event.media?.length || 0), 0
      );

      const storyDataObj: StoryData = {
        date: formatDate(date),
        events: eventsWithMedia,
        slides,
        totalPhotos,
        totalDuration: slides.length * slideDuration,
        daysTogetherCount: 1, // This could be calculated based on relationship start date
        isMemory: false
      };

      setStoryData(storyDataObj);
      setCurrentSlideIndex(0);
      setProgress(0);
      setIsLoading(false);

      return storyDataObj;
    } catch (error) {
      console.error('Error loading day story:', error);
      toast.error('Ошибка при загрузке историй дня');
      setIsLoading(false);
      return null;
    }
  }, [createStorySlides, formatDate]);

  const startStory = useCallback(() => {
    if (!storyData || isPlaying) return;
    
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next slide
          setCurrentSlideIndex(prevIndex => {
            if (prevIndex >= storyData.slides.length - 1) {
              // End of story
              setIsPlaying(false);
              return prevIndex;
            }
            return prevIndex + 1;
          });
          return 0;
        }
        return prev + (100 / (slideDuration / 100));
      });
    }, 100);
  }, [storyData, isPlaying, slideDuration]);

  const pauseStory = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const nextSlide = useCallback(() => {
    if (!storyData) return;
    
    pauseStory();
    setCurrentSlideIndex(prev => {
      const next = Math.min(prev + 1, storyData.slides.length - 1);
      setProgress(0);
      return next;
    });
  }, [storyData, pauseStory]);

  const prevSlide = useCallback(() => {
    if (!storyData) return;
    
    pauseStory();
    setCurrentSlideIndex(prev => {
      const previous = Math.max(prev - 1, 0);
      setProgress(0);
      return previous;
    });
  }, [storyData, pauseStory]);

  const closeStory = useCallback(() => {
    pauseStory();
    setStoryData(null);
    setCurrentSlideIndex(0);
    setProgress(0);
  }, [pauseStory]);

  const setEventAsDayCover = useCallback(async (eventId: string, mediaId: string) => {
    try {
      await eventService.setDayCover(eventId, mediaId);
      toast.success('Обложка дня установлена');
    } catch (error) {
      console.error('Error setting day cover:', error);
      toast.error('Ошибка при установке обложки дня');
    }
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
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
  };
};

export default useDayStory;
