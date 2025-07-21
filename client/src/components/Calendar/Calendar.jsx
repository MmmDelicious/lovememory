import React, { useState, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import eventService from '../../services/event.service';
import Sidebar from '../Sidebar/Sidebar';
import { useMascot } from '../../context/MascotContext';
import { useAuth } from '../../context/AuthContext';
import styles from './Calendar.module.css';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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
          extendedProps: {
            description: event.description,
            isOwner: event.userId === user.id,
            timeRange: timeRange,
            rawEvent: event,
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
    const eventOnDay = events.find(e => e.start.split('T')[0] === arg.dateStr);
    setSelectedEvent(eventOnDay?.extendedProps.rawEvent ? { ...eventOnDay.extendedProps.rawEvent, date: arg.dateStr } : { title: '', description: '', date: arg.dateStr });
    setSidebarOpen(true);
  };
  
  const handleEventClick = (clickInfo) => {
    setSelectedEvent({ ...clickInfo.event.extendedProps.rawEvent, date: clickInfo.event.startStr });
    setSidebarOpen(true);
  };
  
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedEvent(null);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      const dataToSave = {
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.event_date,
        end_date: eventData.end_date
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
      await eventService.updateEvent(event.id, {
        event_date: event.start.toISOString(),
        end_date: event.end ? event.end.toISOString() : null,
      });
      fetchEvents(); 
    } catch (error) {
      console.error("Ошибка при обновлении даты события:", error);
      dropInfo.revert();
    }
  };

  const renderEventContent = (eventInfo) => {
    return (
      <div className={styles.eventContentWrapper}>
        <div className={styles.eventTitle}>{eventInfo.event.title}</div>
        {eventInfo.event.extendedProps.timeRange && (
          <div className={styles.eventTime}>{eventInfo.event.extendedProps.timeRange}</div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.calendarContainer} ref={calendarContainerRef}>
      <FullCalendar
        ref={calendarRef}
        key={isMobile ? 'mobile' : 'desktop'}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView={isMobile ? 'dayGridWeek' : 'dayGridMonth'}
        weekends={true}
        events={events}
        locale="ru"
        firstDay={1}
        headerToolbar={isMobile 
          ? { left: 'prev', center: 'title', right: 'next' }
          : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek,dayGridDay' }
        }
        buttonText={{ today: 'сегодня', month: 'месяц', week: 'неделя', day: 'день' }}
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
      />
    </div>
  );
};

export default Calendar;