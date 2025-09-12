import { useState, useEffect, useCallback } from 'react';
import { eventService } from '../services';

interface DayDetailEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  event_type: string;
  duration?: number;
  location?: string;
  isShared?: boolean;
  isImportant?: boolean;
  completed?: boolean;
  media?: any[];
  [key: string]: any;
}

/**
 * Хук для управления детальной информацией о дне
 * Загружает события дня, медиа, обрабатывает действия с событиями
 */
export const useDayDetail = (date: string, userId: string) => {
  const [events, setEvents] = useState<DayDetailEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка событий дня
  const fetchDayEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await eventService.getEvents();
      const allEvents = response.data;
      
      // Фильтруем события по дню
      const dayEvents = allEvents.filter((event: any) => 
        new Date(event.event_date).toISOString().split('T')[0] === date
      );
      
      // Сортируем по времени
      dayEvents.sort((a: any, b: any) => 
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      );
      
      // Загружаем медиа для каждого события
      const eventsWithMedia = await Promise.all(
        dayEvents.map(async (event: any) => {
          try {
            const mediaResponse = await eventService.getMediaForEvent(event.id);
            return {
              ...event,
              media: mediaResponse.data || []
            };
          } catch (error) {
            console.warn(`Failed to load media for event ${event.id}:`, error);
            return {
              ...event,
              media: []
            };
          }
        })
      );
      
      setEvents(eventsWithMedia);
    } catch (err) {
      console.error('Error loading day events:', err);
      setError('Не удалось загрузить события дня');
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  // Обновление события
  const updateEvent = useCallback(async (eventId: string, updates: Partial<DayDetailEvent>) => {
    const response = await eventService.updateEvent(eventId, updates);
    
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, ...response.data }
        : event
    ));
    
    return response.data;
  }, []);

  // Удаление события
  const deleteEvent = useCallback(async (eventId: string) => {
    await eventService.deleteEvent(eventId);
    
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, []);

  // Загрузка медиа
  const uploadMedia = useCallback(async (eventId: string, file: File) => {
    const response = await eventService.uploadFile(eventId, file);
    
    // Обновляем событие с новым медиа
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            media: [...(event.media || []), response.data]
          }
        : event
    ));
    
    return response.data;
  }, []);

  // Перемещение медиа между событиями
  const moveMedia = useCallback(async (mediaId: string, targetEventId: string) => {
    await eventService.moveMediaToEvent(mediaId, targetEventId);
    
    // Перезагружаем события для обновления медиа
    await fetchDayEvents();
  }, [fetchDayEvents]);

  // Загрузка при изменении даты
  useEffect(() => {
    if (date && userId) {
      fetchDayEvents();
    }
  }, [date, userId, fetchDayEvents]);

  return {
    events,
    isLoading,
    error,
    updateEvent,
    deleteEvent,
    uploadMedia,
    moveMedia,
    refetch: fetchDayEvents
  };
};