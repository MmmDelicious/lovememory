import { useState, useCallback, useMemo } from 'react';
import { EventDropArg, EventClickArg } from '@fullcalendar/core';
import { EVENT_TYPE_COLORS } from './useEvents';
import { getHueFromHex, darken } from '../../../shared/utils/color';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor?: string;
  borderColor?: string;
  editable?: boolean;
  extendedProps?: {
    rawEvent?: any;
    eventType?: string;
    isOwner?: boolean;
    isShared?: boolean;
    timeRange?: string;
  };
}

interface UseCalendarProps {
  events: CalendarEvent[];
  userId: string;
  onUpdateEvent: (eventId: string, updates: any) => Promise<void>;
  onCreateEvent: (eventData: any) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
}

/**
 * Хук для управления состоянием и логикой календаря
 * Выносит всю тяжелую логику из компонента Calendar
 */
export const useCalendar = ({
  events,
  userId,
  onUpdateEvent,
  onCreateEvent,
  onDeleteEvent
}: UseCalendarProps) => {
  // Состояние календаря
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Обработка переноса событий
  const handleEventDrop = useCallback(async (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    const rawEvent = event.extendedProps.rawEvent;
    
    if (!rawEvent || !event.extendedProps.isOwner) {
      dropInfo.revert();
      return;
    }

    try {
      await onUpdateEvent(rawEvent.id, {
        event_date: event.startStr
      });
    } catch (error) {
      console.error('Error updating event:', error);
      dropInfo.revert();
    }
  }, [onUpdateEvent]);

  // Обработка клика по событию
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const calendarEvent: CalendarEvent = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      backgroundColor: event.backgroundColor || undefined,
      borderColor: event.borderColor || undefined,
      editable: event.startEditable,
      extendedProps: event.extendedProps as any
    };
    setSelectedEvent(calendarEvent);
  }, []);

  // Фильтрация событий
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Фильтр по типу события
      if (activeFilters.length > 0) {
        const eventType = event.extendedProps?.eventType || 'default';
        if (!activeFilters.includes(eventType)) {
          return false;
        }
      }

      // Поиск по названию
      if (searchQuery) {
        return event.title.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return true;
    });
  }, [events, activeFilters, searchQuery]);

  // Форматирование событий для FullCalendar
  const formattedEvents = useMemo(() => {
    return filteredEvents.map(event => {
      const eventType = event.extendedProps?.eventType || 'default';
      const color = EVENT_TYPE_COLORS[eventType] || EVENT_TYPE_COLORS.default;
      
      return {
        ...event,
        backgroundColor: color,
        borderColor: darken(color, 0.2),
        textColor: getHueFromHex(color) > 180 ? '#000' : '#fff'
      };
    });
  }, [filteredEvents]);

  // Переключение фильтров
  const toggleFilter = useCallback((filterType: string) => {
    setActiveFilters(prev => 
      prev.includes(filterType)
        ? prev.filter(f => f !== filterType)
        : [...prev, filterType]
    );
  }, []);

  return {
    // Состояние
    currentView,
    isFiltersOpen,
    isSidebarOpen,
    selectedEvent,
    activeFilters,
    searchQuery,
    
    // События
    formattedEvents,
    
    // Обработчики
    handleEventDrop,
    handleEventClick,
    toggleFilter,
    
    // Сеттеры
    setCurrentView,
    setIsFiltersOpen,
    setIsSidebarOpen,
    setSelectedEvent,
    setSearchQuery
  };
};
