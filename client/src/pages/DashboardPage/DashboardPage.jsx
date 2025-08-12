import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Draggable } from '@fullcalendar/interaction';
import { useAuth } from '../../context/AuthContext';
import { useEvents, EVENT_TYPE_COLORS } from '../../hooks/useEvents';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { getHueFromHex } from '../../utils/color';

import CalendarLayout from '../../layouts/CalendarLayout/CalendarLayout';
import CalendarSidebar from '../../components/Calendar/CalendarSidebar';
import CalendarView from '../../components/Calendar/CalendarView';
import Sidebar from '../../components/Sidebar/Sidebar'; // Event creation/edit sidebar

import styles from './DashboardPage.module.css';

const TYPE_LABELS = {
  plan: 'План',
  memory: 'Воспоминание',
  anniversary: 'Годовщина',
  birthday: 'День рождения',
  travel: 'Путешествие',
  date: 'Свидание',
  gift: 'Подарок',
  deadline: 'Дедлайн',
};

// Main content component (web-focused)
const CalendarMainContent = ({
  // All other props
  calendarRef,
  monthLabel,
  goPrev,
  goNext,
  currentView,
  changeView,
  goToday,
  setShowFilters,
  setShowList,
  handleAddQuick,
  showFilters,
  filter,
  setFilter,
  showList,
  filteredEvents,
  handleEventClick,
  initialView,
  handleEventReceive,
  handleEventDrop,
  handleDateClick,
  handleContextMenu,
}) => {
  // We will add more components here like CalendarHeader, EventListPanel later
  // For now, let's keep it simple
  return (
    <>
      <div className={styles.calendarHeaderMain}>
          <div className={styles.calendarTitle}>
            <h1>{monthLabel}</h1>
            <div className={`${styles.calendarNav} ${styles.mainNav}`}>
              <button className={styles.navArrow} aria-label="Предыдущий" onClick={goPrev}><i className="fas fa-chevron-left"></i></button>
              <button className={styles.navArrow} aria-label="Следующий" onClick={goNext}><i className="fas fa-chevron-right"></i></button>
            </div>
          </div>
          {/* Actions etc. would be in a CalendarHeader component */}
      </div>

      <CalendarView
        calendarRef={calendarRef}
        events={filteredEvents}
        initialView={initialView}
        handleEventReceive={handleEventReceive}
        handleEventDrop={handleEventDrop}
        handleDateClick={handleDateClick}
        handleEventClick={handleEventClick}
        handleContextMenu={handleContextMenu}
      />
    </>
  );
};


const DashboardPage = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const navigate = useNavigate();
  

  const {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent
  } = useEvents(user?.id);

  const [isEditSidebarOpen, setEditSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, event: null });
  
  const calendarRef = useRef(null);
  const templateContainerRef = useRef(null);

  useEffect(() => {
    if (error) {
      handleError(error, 'Ошибка при загрузке календаря');
    }
  }, [error, handleError]);

  useEffect(() => {
    if (templateContainerRef.current) {
      new Draggable(templateContainerRef.current, {
        itemSelector: '.js-template-item',
        eventData: (el) => ({
          title: el.getAttribute('data-title') || 'Событие',
          extendedProps: { eventType: el.getAttribute('data-type') || 'plan', isOwner: true, isShared: false },
          backgroundColor: el.getAttribute('data-color') || '#D97A6C',
          borderColor: el.getAttribute('data-color') || '#D97A6C',
          allDay: true,
        }),
      });
    }
  }, [isLoading]); // Re-run when calendar is loaded

  const sortedTypeEntries = useMemo(() => {
    return Object.entries(EVENT_TYPE_COLORS)
      .sort(([, c1], [, c2]) => getHueFromHex(c1) - getHueFromHex(c2));
  }, []);

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    const eventOnDay = events.find(e => e.start.split('T')[0] === arg.dateStr);
    setSelectedEvent(eventOnDay?.extendedProps.rawEvent ? { ...eventOnDay.extendedProps.rawEvent, date: arg.dateStr } : { title: '', description: '', date: arg.dateStr });
    setEditSidebarOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    setSelectedDate(clickInfo.event.startStr.split('T')[0]);
    setSelectedEvent({
      ...clickInfo.event.extendedProps.rawEvent,
      date: clickInfo.event.startStr,
      timeRange: clickInfo.event.extendedProps.timeRange
    });
    setEditSidebarOpen(true);
  };

  const handleCloseEditSidebar = () => {
    setEditSidebarOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleSaveEvent = async (eventData) => {
    const dataToSave = {
      title: eventData.title, description: eventData.description, event_date: eventData.event_date, end_date: eventData.end_date, event_type: eventData.event_type, isShared: eventData.isShared, is_recurring: eventData.is_recurring, recurrence_rule: eventData.recurrence_rule
    };
    if (eventData.id) {
      await updateEvent(eventData.id, dataToSave);
    } else {
      await createEvent(dataToSave);
    }
    handleCloseEditSidebar();
  };

  const handleDeleteEvent = async (eventId) => {
    await deleteEvent(eventId);
    handleCloseEditSidebar();
  };

  const handleEventDrop = async (dropInfo) => {
    const { event } = dropInfo;
    const oldStart = new Date(event.extendedProps.rawEvent.event_date);
    const oldEnd = event.extendedProps.rawEvent.end_date ? new Date(event.extendedProps.rawEvent.end_date) : null;
    const newStart = event.start;
    let newEnd = null;
    if (oldEnd) {
      const duration = oldEnd.getTime() - oldStart.getTime();
      newEnd = new Date(newStart.getTime() + duration);
    }
    const updateData = { event_date: newStart.toISOString() };
    if (newEnd) {
      updateData.end_date = newEnd.toISOString();
    }
    await updateEvent(event.id, updateData);
  };
  
  const handleEventReceive = (info) => {
      const type = info.event.extendedProps?.eventType || 'plan';
      const dateStr = info.event.startStr.split('T')[0];
      setSelectedDate(dateStr);
      setSelectedEvent({ title: info.event.title || '', description: '', date: dateStr, event_type: type });
      setEditSidebarOpen(true);
      info.event.remove();
  };

  const handleContextMenu = (event, clickInfo) => {
    event.preventDefault();
    const { clientX, clientY } = event;
    const menuWidth = 180, menuHeight = 110;
    const x = clientX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 5 : clientX;
    const y = clientY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 5 : clientY;
    setContextMenu({ show: true, x, y, event: clickInfo });
  };
  
  const handleContextMenuClose = () => {
    setContextMenu({ show: false, x: 0, y: 0, event: null });
  };
  
  const handleContextMenuAction = (action) => {
    const { event } = contextMenu.event;
    switch (action) {
      case 'delete': handleDeleteEvent(event.id); break;
      case 'view': navigate(`/day/${event.startStr.split('T')[0]}`); break;
      case 'edit': handleEventClick({ event }); break;
    }
    handleContextMenuClose();
  };

  const calendarApi = calendarRef.current?.getApi();
  const goPrev = () => calendarApi?.prev();
  const goNext = () => calendarApi?.next();
  const goToday = () => calendarApi?.today();
  const changeView = (view) => calendarApi?.changeView(view);
  const gotoDate = (date) => calendarApi?.gotoDate(date);

  useEffect(() => {
    if (calendarApi) {
      const handleDatesSet = (arg) => {
        setCurrentDate(arg.view.currentStart);
        setCurrentTitle(arg.view.title || '');
        setCurrentView(arg.view.type || 'dayGridMonth');
      };
      calendarApi.on('datesSet', handleDatesSet);
      handleDatesSet({ view: calendarApi.view }); // Initial set
      return () => calendarApi.off('datesSet');
    }
  }, [calendarApi]);

  const monthLabel = useMemo(() => currentTitle || currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }), [currentDate, currentTitle]);

  const getMiniCalendarDays = useCallback((baseDate) => {
    const result = [];
    const firstOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const startDay = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - startDay);
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      result.push(d);
    }
    return result;
  }, []);
  
  const miniDays = useMemo(() => getMiniCalendarDays(currentDate), [getMiniCalendarDays, currentDate]);
  
  const filteredEvents = useMemo(() => events.filter(event => {
    // Simplified filter logic for brevity
    if (filter === 'all') return true;
    if (filter === 'mine') return event.extendedProps?.isOwner;
    if (filter === 'shared') return event.extendedProps?.isShared;
    return true;
  }), [events, filter]);

  if (isLoading) {
    return <div className={styles.loader}>Загрузка календаря...</div>;
  }

  return (
    <>
      <CalendarLayout
        sidebar={
          <CalendarSidebar
            monthLabel={monthLabel}
            goPrev={goPrev}
            goNext={goNext}
            miniDays={miniDays}
            currentDate={currentDate}
            gotoDate={gotoDate}
            templateContainerRef={templateContainerRef}
            sortedTypeEntries={sortedTypeEntries}
            TYPE_LABELS={TYPE_LABELS}
            filter={filter}
            setFilter={setFilter}
          />
        }
      >
        {/* This will be the main content area */}
        <CalendarMainContent
            calendarRef={calendarRef}
            monthLabel={monthLabel}
            goPrev={goPrev}
            goNext={goNext}
            currentView={currentView}
            changeView={changeView}
            goToday={goToday}
            handleAddQuick={() => handleDateClick({dateStr: new Date().toISOString().slice(0,10)})}
            filteredEvents={filteredEvents}
            handleEventClick={handleEventClick}
            initialView={currentView}
            handleEventReceive={handleEventReceive}
            handleEventDrop={handleEventDrop}
            handleDateClick={handleDateClick}
            handleContextMenu={handleContextMenu}
        />
      </CalendarLayout>
      
      {contextMenu.show && (
        <div 
          className={styles.contextMenu}
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1100 }}
          onClick={handleContextMenuClose}
        >
          <div className={styles.contextMenuItem} onClick={() => handleContextMenuAction('edit')}>✏️ Редактировать</div>
          <div className={styles.contextMenuItem} onClick={() => handleContextMenuAction('view')}>👁️ Посмотреть день</div>
          <div className={styles.contextMenuItem} onClick={() => handleContextMenuAction('delete')}>🗑️ Удалить событие</div>
        </div>
      )}

      <Sidebar
        isOpen={isEditSidebarOpen}
        onClose={handleCloseEditSidebar}
        eventData={selectedEvent}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        selectedDate={selectedDate}
      />
    </>
  );
};

export default DashboardPage;