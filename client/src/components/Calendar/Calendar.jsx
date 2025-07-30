import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import Sidebar from '../Sidebar/Sidebar';
import CalendarFilters from './SearchAndFilter';
import { useMascot } from '../../context/MascotContext';
import styles from './Calendar.module.css';

const Calendar = ({ events, userId, onCreateEvent, onUpdateEvent, onDeleteEvent }) => {
  const navigate = useNavigate();
  

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const calendarRef = useRef(null);
  const calendarContainerRef = useRef(null);
  const { hideMascot, registerMascotTargets, startMascotLoop, stopMascotLoop, clearMascotTargets } = useMascot();

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
        await onUpdateEvent(eventData.id, dataToSave);
      } else {
        await onCreateEvent(dataToSave);
      }
      handleCloseSidebar();
    } catch (error) { console.error("Ошибка при сохранении события:", error); }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await onDeleteEvent(eventId);
      handleCloseSidebar();
    } catch (error) { console.error("Ошибка при удалении события:", error); }
  };

  const handleEventDrop = async (dropInfo) => {
    const { event } = dropInfo;
    try {
      const oldStart = new Date(event.extendedProps.rawEvent.event_date);
      const oldEnd = event.extendedProps.rawEvent.end_date ? new Date(event.extendedProps.rawEvent.end_date) : null;
      const newStart = event.start;
      let newEnd = null;
      if (oldEnd) {
        const duration = oldEnd.getTime() - oldStart.getTime();
        newEnd = new Date(newStart.getTime() + duration);
      }
      await onUpdateEvent(event.id, {
        event_date: newStart.toISOString(),
        end_date: newEnd ? newEnd.toISOString() : null,
      });
    } catch (error) {
      console.error("Ошибка при обновлении даты события:", error);
      dropInfo.revert();
    }
  };

  const getEventTypeIcon = (eventType) => {
    const icons = {
      memory: '💭', plan: '📅', anniversary: '💕', birthday: '🎂',
      travel: '✈️', date: '💖', gift: '🎁', milestone: '⭐'
    };
    return icons[eventType] || '📅';
  };

  const renderEventContent = (eventInfo) => (
    <div className={styles.eventContentWrapper}>
      <div className={styles.eventTitle}>
        <span className={styles.eventIcon}>
          {getEventTypeIcon(eventInfo.event.extendedProps.eventType)}
        </span>
        {eventInfo.event.title}
      </div>
    </div>
  );

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

  const matchesFilter = (event) => {
    const { now, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = getDateFilters();
    const eventDate = new Date(event.start);
    switch (filter) {
      case 'all': return true;
      case 'mine': return event.extendedProps?.isOwner;
      case 'shared': return event.extendedProps?.isShared;

      case 'partner': return !event.extendedProps?.isOwner;
      case 'upcoming': return eventDate >= now;
      case 'this_week': return eventDate >= startOfWeek && eventDate <= endOfWeek;
      case 'this_month': return eventDate >= startOfMonth && eventDate <= endOfMonth;
      case 'birthdays': return event.extendedProps?.eventType === 'birthday';
      case 'anniversaries': return event.extendedProps?.eventType === 'anniversary';
      case 'memories': return event.extendedProps?.eventType === 'memory';
      case 'travel': return event.extendedProps?.eventType === 'travel';
      default: return true;
    }
  };

  const filteredEvents = events.filter(event => matchesFilter(event));
  


  return (
    <div className={styles.calendarContainer} ref={calendarContainerRef}>
      <div className={styles.filtersWrapper}>
        <CalendarFilters onFilterChange={setFilter} activeFilter={filter} />

      </div>
      <div className={styles.calendarWrapper}>
        {filteredEvents.length === 0 && events.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '400px',
            fontSize: '16px',
            color: '#666'
          }}>
            Нет событий для отображения
          </div>
        ) : (
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
            buttonText={{ today: 'сегодня', month: 'месяц', week: 'неделя', day: 'день', list: 'список' }}
            height="100%"
            editable={true}
            eventDrop={handleInteraction(handleEventDrop)}
            dateClick={handleInteraction(handleDateClick)}
            eventClick={handleInteraction(handleEventClick)}
            eventContent={renderEventContent}
            eventClassNames={(arg) => arg.event.extendedProps.isOwner ? styles.eventMine : styles.eventPartner}
          />
        )}
      </div>
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