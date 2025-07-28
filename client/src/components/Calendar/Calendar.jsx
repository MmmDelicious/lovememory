import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import eventService from '../../services/event.service';
import Sidebar from '../Sidebar/Sidebar';
import CalendarFilters from './SearchAndFilter';
import { useMascot } from '../../context/MascotContext';
import { useAuth } from '../../context/AuthContext';
import styles from './Calendar.module.css';

const EVENT_TYPE_COLORS = {
  memory: '#8B5CF6',     // фиолетовый
  plan: '#3B82F6',       // синий
  anniversary: '#EF4444', // красный
  birthday: '#F59E0B',   // оранжевый
  travel: '#10B981',     // зеленый
  date: '#EC4899',       // розовый
  gift: '#F97316',       // оранжевый
  milestone: '#6366F1'   // индиго
};

const Calendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const calendarRef = useRef(null);
  const calendarContainerRef = useRef(null);
  const { hideMascot, registerMascotTargets, startMascotLoop, stopMascotLoop, clearMascotTargets } = useMascot();
  const { user, isAuthenticated } = useAuth();

  const formatTime = (date) => new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      const response = await eventService.getEvents();
      const formattedEvents = response.data.map(event => {
        const hasTime = !event.event_date.endsWith('00:00:00.000Z') || (event.end_date && !event.end_date.endsWith('00:00:00.000Z'));
        
        let timeRange = null;
        if (event.event_date) {
          const startTime = formatTime(event.event_date);
          if (event.end_date) {
            const endTime = formatTime(event.end_date);
            timeRange = `${startTime} - ${endTime}`;
          } else {
            if (startTime !== '00:00') {
               timeRange = startTime;
            }
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
            isOwner: event.userId === user.id,
            isShared: !!event.isShared,
            eventType: event.event_type,
            rawEvent: event,
            timeRange: timeRange,
          }
        };
      });
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Ошибка при загрузке событий:", error);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const updateMascotTargets = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi || events.length === 0) {
      registerMascotTargets([]);
      return;
    }
    
    const dayCells = calendarApi.el.querySelectorAll('[data-date]');
    const cellMap = new Map();
    dayCells.forEach(cell => {
      cellMap.set(cell.getAttribute('data-date'), cell);
    });

    const allEvents = calendarApi.getEvents();
    const targets = allEvents.reduce((acc, event) => {
      const dayCell = cellMap.get(event.startStr.split('T')[0]);
      if (dayCell) {
        acc.push({
          page: 'dashboard',
          data: { event: event.extendedProps.rawEvent },
          element: dayCell,
          containerRef: calendarContainerRef,
          onActionClick: () => handleEventClick({ event }),
        });
      }
      return acc;
    }, []);
    registerMascotTargets(targets);
  }, [events, calendarRef, calendarContainerRef, registerMascotTargets]);

  useEffect(() => {
    updateMascotTargets();
    startMascotLoop();

    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.on('datesSet', updateMascotTargets);
    }

    return () => {
      stopMascotLoop();
      clearMascotTargets();
      if (calendarApi) {
        calendarApi.off('datesSet', updateMascotTargets);
      }
    };
  }, [updateMascotTargets, startMascotLoop, stopMascotLoop, clearMascotTargets]);

  const handleInteraction = (handler) => (...args) => {
    hideMascot();
    handler(...args);
  };
  
  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    const eventOnDay = events.find(e => e.start.split('T')[0] === arg.dateStr);
    setSelectedEvent(eventOnDay?.extendedProps.rawEvent ? { ...eventOnDay.extendedProps.rawEvent, date: arg.dateStr } : { title: '', description: '', date: arg.dateStr });
    setSidebarOpen(true);
  };
  
  const handleEventClick = (clickInfo) => {
    setSelectedDate(clickInfo.event.startStr.split('T')[0]);
    setSelectedEvent({ 
      ...clickInfo.event.extendedProps.rawEvent, 
      date: clickInfo.event.startStr,
      timeRange: clickInfo.event.extendedProps.timeRange
    });
    setSidebarOpen(true);
  };
  
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleViewDay = () => {
    if (selectedDate) {
      navigate(`/day/${selectedDate}`);
    }
  };

  const handleSaveEvent = async (eventData) => {
    try {
      const dataToSave = {
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.event_date,
        end_date: eventData.end_date,
        event_type: eventData.event_type,
        isShared: eventData.isShared,
        is_recurring: eventData.is_recurring,
        recurrence_rule: eventData.recurrence_rule
      };

      if (eventData.id) {
        await eventService.updateEvent(eventData.id, dataToSave);
      } else {
        await eventService.createEvent(dataToSave);
      }
      fetchEvents();
      handleCloseSidebar();
    } catch (error) { console.error("Ошибка при сохранении события:", error); }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await eventService.deleteEvent(eventId);
      fetchEvents();
      handleCloseSidebar();
    } catch (error) { console.error("Ошибка при удалении события:", error); }
  };

  const handleEventDrop = async (dropInfo) => {
    const { event } = dropInfo;
    try {
      // вычисляем дельту между старой и новой датой начала
      const oldStart = new Date(event.extendedProps.rawEvent.event_date);
      const oldEnd = event.extendedProps.rawEvent.end_date ? new Date(event.extendedProps.rawEvent.end_date) : null;
      const newStart = event.start;
      let newEnd = null;
      if (oldEnd) {
        const duration = oldEnd.getTime() - oldStart.getTime();
        newEnd = new Date(newStart.getTime() + duration);
      }
      await eventService.updateEvent(event.id, {
        event_date: newStart.toISOString(),
        end_date: newEnd ? newEnd.toISOString() : null,
      });
      fetchEvents(); 
    } catch (error) {
      console.error("Ошибка при обновлении даты события:", error);
      dropInfo.revert();
    }
  };

  const getEventTypeIcon = (eventType) => {
    const icons = {
      memory: '💭',
      plan: '📅',
      anniversary: '💕',
      birthday: '🎂',
      travel: '✈️',
      date: '💖',
      gift: '🎁',
      milestone: '⭐'
    };
    return icons[eventType] || '📅';
  };

  const renderEventContent = (eventInfo) => {
    return (
      <div className={styles.eventContentWrapper}>
        <div className={styles.eventTitle}>
          <span className={styles.eventIcon}>
            {getEventTypeIcon(eventInfo.event.extendedProps.eventType)}
          </span>
          {eventInfo.event.title}
        </div>
        {/* Убираем время из отображения - будет показываться в сайдбаре */}
      </div>
    );
  };

  const getDateFilters = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return { now, startOfWeek, endOfWeek, startOfMonth, endOfMonth };
  };

  // Убрали функцию поиска

  const matchesFilter = (event) => {
    const { now, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = getDateFilters();
    const eventDate = new Date(event.start);
    
    switch (filter) {
      case 'all':
        return true;
      case 'mine':
        return event.extendedProps?.isOwner; // Все мои события (личные + общие)
      case 'shared':
        return event.extendedProps?.isShared; // Только общие события
      case 'partner':
        return !event.extendedProps?.isOwner; // Только события партнера
      case 'upcoming':
        return eventDate >= now;
      case 'this_week':
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
      case 'this_month':
        return eventDate >= startOfMonth && eventDate <= endOfMonth;
      case 'birthdays':
        return event.extendedProps?.eventType === 'birthday';
      case 'anniversaries':
        return event.extendedProps?.eventType === 'anniversary';
      case 'memories':
        return event.extendedProps?.eventType === 'memory';
      case 'travel':
        return event.extendedProps?.eventType === 'travel';
      default:
        return true;
    }
  };

  const filteredEvents = events.filter(event => matchesFilter(event));

  return (
    <div className={styles.calendarContainer} ref={calendarContainerRef}>
      <CalendarFilters 
        onFilterChange={setFilter}
        activeFilter={filter}
      />
      <FullCalendar
        ref={calendarRef}
        key={isMobile ? 'mobile' : 'desktop'}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView={isMobile ? 'dayGridWeek' : 'dayGridMonth'}
        weekends={true}
        events={filteredEvents}
        locale="ru"
        firstDay={1}
        headerToolbar={isMobile 
          ? { left: 'prev', center: 'title', right: 'next' }
          : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek,dayGridDay' }
        }
        buttonText={{ 
          today: 'сегодня', 
          month: 'месяц', 
          week: 'неделя', 
          day: 'день',
          list: 'список'
        }}
        height="100%"
        editable={true}
        eventDrop={handleInteraction(handleEventDrop)}
        dateClick={handleInteraction(handleDateClick)}
        eventClick={handleInteraction(handleEventClick)}
        eventContent={renderEventContent}
        eventClassNames={(arg) => {
          return arg.event.extendedProps.isOwner ? styles.eventMine : styles.eventPartner;
        }}
      />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={handleCloseSidebar}
        eventData={selectedEvent}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        selectedDate={selectedDate}
        onViewDay={handleViewDay}
      />
    </div>
  );
};

export default Calendar;