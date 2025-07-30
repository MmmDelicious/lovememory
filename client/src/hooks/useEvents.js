import { useState, useEffect, useCallback } from 'react';
// БЫЛО: import eventService from '../services/event.service';
// СТАЛО:
import { eventService } from '../services';

const EVENT_TYPE_COLORS = {
  memory: '#8B5CF6',
  plan: '#3B82F6',
  anniversary: '#EF4444',
  birthday: '#F59E0B',
  travel: '#10B981',
  date: '#EC4899',
  gift: '#F97316',
  milestone: '#6366F1'
};

const formatTime = (date) => new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

const formatEvent = (event, userId) => {
  const hasTime = !event.event_date.endsWith('00:00:00.000Z') || (event.end_date && !event.end_date.endsWith('00:00:00.000Z'));
  let timeRange = null;
  if (event.event_date) {
    const startTime = formatTime(event.event_date);
    if (event.end_date) {
      const endTime = formatTime(event.end_date);
      timeRange = `${startTime} - ${endTime}`;
    } else if (startTime !== '00:00') {
      timeRange = startTime;
    }
  }

  return {
    id: event.id,
    title: event.title,
    start: event.event_date,
    end: event.end_date,
    allDay: !hasTime,
    backgroundColor: EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.plan,
    borderColor: EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.plan,
    extendedProps: {
      description: event.description,
      isOwner: event.userId === userId,
      isShared: !!event.isShared,
      eventType: event.event_type,
      rawEvent: event,
      timeRange: timeRange,
    }
  };
};

export const useEvents = (userId) => {
  const [rawEvents, setRawEvents] = useState([]);
  const [formattedEvents, setFormattedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await eventService.getEvents();
      const data = response.data;
      setRawEvents(data);
      const formatted = data.map(event => formatEvent(event, userId));
      setFormattedEvents(formatted);
    } catch (err) {
      setError(err);
      console.error("Ошибка при загрузке событий:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchEvents();
    }
  }, [userId, fetchEvents]);

  const createEvent = async (eventData) => {
    await eventService.createEvent(eventData);
    fetchEvents(); 
  };

  const updateEvent = async (eventId, eventData) => {
    await eventService.updateEvent(eventId, eventData);
    fetchEvents();
  };

  const deleteEvent = async (eventId) => {
    await eventService.deleteEvent(eventId);
    fetchEvents();
  };

  return { 
    events: formattedEvents, 
    isLoading, 
    error,
    createEvent,
    updateEvent,
    deleteEvent
  };
};