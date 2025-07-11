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
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await eventService.getEvents();
      const formattedEvents = response.data.map(event => ({
        id: event.id,
        title: event.title,
        start: event.event_date.split('T')[0],
        date: event.event_date.split('T')[0],
        extendedProps: {
          description: event.description,
          rawEvent: event,
        }
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Ошибка при загрузке событий:", error);
    }
  }, [isAuthenticated]);

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
      const dayCell = cellMap.get(event.startStr);
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
    const eventOnDay = events.find(e => e.start === arg.dateStr);
    setSelectedEvent(eventOnDay || { title: '', description: '', date: arg.dateStr });
    setSidebarOpen(true);
  };
  
  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setSidebarOpen(true);
  };
  
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedEvent(null);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (eventData.id) {
        await eventService.updateEvent(eventData.id, { title: eventData.title, description: eventData.description });
      } else {
        await eventService.createEvent({ title: eventData.title, description: eventData.description, event_date: eventData.date });
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

  return (
    <div className={styles.calendarContainer} ref={calendarContainerRef}>
      <FullCalendar
        ref={calendarRef}
        key={isMobile ? 'mobile' : 'desktop'}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView={isMobile ? 'dayGridWeek' : 'dayGridMonth'}
        weekends={true}
        events={events}
        dateClick={handleInteraction(handleDateClick)}
        eventClick={handleInteraction(handleEventClick)}
        locale="ru"
        firstDay={1}
        headerToolbar={isMobile 
          ? { left: 'prev', center: 'title', right: 'next' }
          : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek,dayGridDay' }
        }
        buttonText={{ today: 'сегодня', month: 'месяц', week: 'неделя', day: 'день' }}
        height="100%"
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