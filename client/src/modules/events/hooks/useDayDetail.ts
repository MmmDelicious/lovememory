import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/event.service';

interface DayDetailState {
  events: any[];
  loading: boolean;
  error: string | null;
  selectedImage: string | null;
  uploadingMedia: Record<string, boolean>;
}

export const useDayDetail = (date: string) => {
  const navigate = useNavigate();
  const [state, setState] = useState<DayDetailState>({
    events: [],
    loading: true,
    error: null,
    selectedImage: null,
    uploadingMedia: {}
  });

  // Fetch events for the day
  const fetchDayEvents = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await eventService.getEvents();
      const dayEvents = response.data.filter(event => 
        new Date(event.event_date).toISOString().split('T')[0] === date
      );
      
      // Process events with media
      const eventsWithMedia = await Promise.all(
        dayEvents.map(async (event) => {
          try {
            const mediaResponse = await eventService.getMediaForEvent(event.id);
            return { ...event, media: mediaResponse.data || [] };
          } catch {
            return { ...event, media: [] };
          }
        })
      );

      setState(prev => ({ 
        ...prev, 
        events: eventsWithMedia.sort((a, b) => 
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        ),
        loading: false 
      }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: 'Не удалось загрузить события дня', 
        loading: false 
      }));
    }
  }, [date]);

  // Media upload
  const uploadMedia = useCallback(async (eventId: string, files: FileList) => {
    setState(prev => ({ 
      ...prev, 
      uploadingMedia: { ...prev.uploadingMedia, [eventId]: true }
    }));

    try {
      await Promise.all(
        Array.from(files).map(file => eventService.uploadFile(eventId, file))
      );
      await fetchDayEvents();
    } finally {
      setState(prev => ({ 
        ...prev, 
        uploadingMedia: { ...prev.uploadingMedia, [eventId]: false }
      }));
    }
  }, [fetchDayEvents]);

  // Event actions
  const deleteEvent = useCallback(async (eventId: string) => {
    await eventService.deleteEvent(eventId);
    await fetchDayEvents();
  }, [fetchDayEvents]);

  const editEvent = useCallback((eventId: string) => {
    navigate(`/event/edit/${eventId}`);
  }, [navigate]);

  useEffect(() => {
    fetchDayEvents();
  }, [fetchDayEvents]);

  return {
    ...state,
    uploadMedia,
    deleteEvent,
    editEvent,
    setSelectedImage: (image: string | null) => 
      setState(prev => ({ ...prev, selectedImage: image })),
    refreshEvents: fetchDayEvents
  };
};
