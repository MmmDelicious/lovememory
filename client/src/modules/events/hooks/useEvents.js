import { useState, useEffect, useCallback } from 'react';
import { eventService } from '../services';
export const EVENT_TYPE_COLORS = {
  plan: '#D97A6C',        // основной тёплый терракотовый
  memory: '#C78986',      // тёплый пыльно-розовый
  anniversary: '#D35D5D', // акцент для годовщин
  birthday: '#E89A8C',    // мягкий персиково-розовый
  travel: '#C49A6C',      // тёплый песочный
  date: '#E06A80',        // розовый для свиданий
  gift: '#E0B070',        // тёплое золото
  deadline: '#9C7CA5'    // приглушенный лиловый
};
const formatTime = (date) => new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const formatEvent = (event, userId) => {
  if (!event) return null;
  const title = (event.title || '').trim();
  const isDateLikeTitle = /^(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)$/i.test(title);
  if (isDateLikeTitle) return null;
  const startDate = new Date(event.event_date);
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const isStartMidnight = startDate.getUTCHours() === 0 && 
                         startDate.getUTCMinutes() === 0 && 
                         startDate.getUTCSeconds() === 0;
  const isEndMidnight = !endDate || 
                       (endDate.getUTCHours() === 0 && 
                        endDate.getUTCMinutes() === 0 && 
                        endDate.getUTCSeconds() === 0);
  const hasTime = !isStartMidnight || !isEndMidnight;
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
  let endForCalendar = event.end_date;
  if (!hasTime && endDate) {
    const exclusiveEndDate = new Date(endDate);
    exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);
    endForCalendar = exclusiveEndDate.toISOString();
  }
  return {
    id: event.id,
    title: event.title,
    start: event.event_date,
    end: endForCalendar,
    allDay: !hasTime,
    editable: true, // Разрешаем перетаскивание всех событий
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
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const response = await eventService.getEvents();
      const data = response.data;
      setRawEvents(data);
      const formatted = data.map(event => formatEvent(event, userId)).filter(Boolean);
      setFormattedEvents(formatted);
    } catch (err) {
      setError(err);
      console.error("Ошибка при загрузке событий:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  const createEvent = async (eventData) => {
    const response = await eventService.createEvent(eventData);
    const newEvent = response.data;
    const formattedNewEvent = formatEvent(newEvent, userId);
    setRawEvents(prev => [...prev, newEvent]);
    if (formattedNewEvent) {
      setFormattedEvents(prev => [...prev, formattedNewEvent]);
    }
  };
  const updateEvent = async (eventId, eventData) => {
    const response = await eventService.updateEvent(eventId, eventData);
    const updatedEvent = response.data;
    const formattedUpdatedEvent = formatEvent(updatedEvent, userId);
    setRawEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
    if (formattedUpdatedEvent) {
      setFormattedEvents(prev => prev.map(e => e.id === eventId ? formattedUpdatedEvent : e));
    }
  };
  const deleteEvent = async (eventId) => {
    await eventService.deleteEvent(eventId);
    setRawEvents(prev => prev.filter(e => e.id !== eventId));
    setFormattedEvents(prev => prev.filter(e => e.id !== eventId));
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
