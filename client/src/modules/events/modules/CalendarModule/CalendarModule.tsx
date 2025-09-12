import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import type { EventDropArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import { CalendarToolbar, CalendarFilters, EventTemplatesList } from '../../../../components/calendar';
import { MiniCalendar } from '../../../../ui/calendar';
import { useCalendar } from '../../hooks/useCalendar';
import { useEvents } from '../../hooks/useEvents';
import { useEventTemplates } from '../../hooks/useEventTemplates';
import { useMascot } from '../../../../context/MascotContext';
import { toast } from '../../../../context/ToastContext';
import { darken } from '../../../../shared/utils/color';
import { EVENT_TYPE_COLORS } from '../../hooks/useEvents';
import StoryViewer from '../../../../shared/components/StoryViewer/StoryViewer';
import Sidebar from '../../../../shared/layout/Sidebar/Sidebar';
import DateGeneratorModal from '../../components/DateGeneratorModal/DateGeneratorModal';
import styles from './CalendarModule.module.css';

interface CalendarModuleProps {
  userId: string;
  onEventClick?: (eventId: string, date: string) => void;
  onDateClick?: (date: string) => void;
  onCreateEvent?: (eventData: any) => void;
  onUpdateEvent?: (eventId: string, eventData: any) => void;
  onDeleteEvent?: (eventId: string) => void;
  className?: string;
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  event: EventClickArg | null;
}

/**
 * Самостоятельный модуль календаря с полной бизнес-логикой
 * Отвечает за: отображение календаря, управление событиями, фильтрацию, шаблоны
 * Содержит собственное состояние, API-вызовы, обработку ошибок
 */
export const CalendarModule: React.FC<CalendarModuleProps> = ({
  userId,
  onEventClick,
  onDateClick,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  className
}) => {
  // Хуки для данных и логики
  const navigate = useNavigate();
  const { events, isLoading: eventsLoading, createEvent, updateEvent, deleteEvent } = useEvents(userId);
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useEventTemplates(userId);
  
  // Состояние модуля
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTitle, setCurrentTitle] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Состояние для сторис и контекстного меню
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
  const [storyViewerDate, setStoryViewerDate] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ show: false, x: 0, y: 0, event: null });
  
  // Дополнительные состояния из legacy
  const [isDateGeneratorOpen, setIsDateGeneratorOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Рефы для календаря и drag & drop
  const calendarRef = useRef<FullCalendar>(null);
  const templateContainerRef = useRef<HTMLDivElement>(null);
  const customTemplatesRef = useRef<HTMLDivElement>(null);
  
  // Хук календаря для сложной логики
  const {
    currentView,
    formattedEvents,
    handleEventDrop,
    handleEventClick: internalEventClick,
    setCurrentView,
    activeFilters,
    toggleFilter
  } = useCalendar({
    events,
    userId,
    onUpdateEvent: handleUpdateEvent,
    onCreateEvent: handleCreateEvent,
    onDeleteEvent: handleDeleteEvent
  });

  // Маскот
  const { hideMascot, registerMascotTargets, startMascotLoop, stopMascotLoop, clearMascotTargets } = useMascot();

  // Обработчики событий
  async function handleCreateEvent(eventData: any) {
    try {
      await createEvent(eventData);
      if (onCreateEvent) onCreateEvent(eventData);
      toast.success('Событие создано!');
    } catch (error) {
      toast.error('Не удалось создать событие');
    }
  }

  async function handleUpdateEvent(eventId: string, eventData: any) {
    try {
      await updateEvent(eventId, eventData);
      if (onUpdateEvent) onUpdateEvent(eventId, eventData);
      toast.success('Событие обновлено!');
    } catch (error) {
      toast.error('Не удалось обновить событие');
    }
  }

  async function handleDeleteEvent(eventId: string) {
    try {
      await deleteEvent(eventId);
      if (onDeleteEvent) onDeleteEvent(eventId);
      toast.success('Событие удалено!');
    } catch (error) {
      toast.error('Не удалось удалить событие');
    }
  }

  // Навигация по календарю
  const goNext = () => calendarRef.current?.getApi()?.next();
  const goPrev = () => calendarRef.current?.getApi()?.prev();
  const goToday = () => calendarRef.current?.getApi()?.today();
  const gotoDate = (date: Date) => calendarRef.current?.getApi()?.gotoDate(date);

  // 🎬 Story функции из legacy
  const openStoryMode = useCallback((date: string) => {
    const dayEvents = events.filter(event => 
      event.start.split('T')[0] === date
    );
    
    if (dayEvents.length === 0) {
      toast.warning('В этот день нет событий для показа', 'Story mode');
      return;
    }
    
    setStoryViewerDate(date);
    setIsStoryViewerOpen(true);
  }, [events, toast]);

  const closeStoryMode = useCallback(() => {
    setIsStoryViewerOpen(false);
    setStoryViewerDate(null);
  }, []);

  // 📝 Контекстное меню функции из legacy
  const handleContextMenuClose = useCallback(() => {
    setContextMenu({ show: false, x: 0, y: 0, event: null });
  }, []);

  const handleContextMenuAction = useCallback((action: 'delete' | 'view' | 'edit' | 'story') => {
    if (!contextMenu.event) return;
    
    const { event } = contextMenu.event;
    switch (action) {
      case 'delete':
        handleDeleteEvent(event.id);
        break;
      case 'view':
        const eventDate = event.startStr.split('T')[0];
        navigate(`/day/${eventDate}`);
        break;
      case 'story':
        const storyEventDate = event.startStr.split('T')[0];
        openStoryMode(storyEventDate);
        break;
      case 'edit':
        setSelectedDate(event.startStr.split('T')[0]);
        setSelectedEvent({ 
          ...event.extendedProps?.rawEvent!, 
          date: event.startStr,
          timeRange: event.extendedProps?.timeRange
        });
        setSidebarOpen(true);
        break;
    }
    handleContextMenuClose();
  }, [contextMenu, navigate, openStoryMode, handleDeleteEvent]);

  const handleContextMenu = useCallback((e: MouseEvent, clickInfo: EventClickArg) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      event: clickInfo
    });
  }, []);

  // 💕 DateGenerator функции из legacy
  const handleDateGenerated = useCallback((event: any) => {
    if (event && onCreateEvent) {
      onCreateEvent(event);
      setIsDateGeneratorOpen(false);
      toast.success('Свидание успешно добавлено в календарь!');
    }
  }, [onCreateEvent, toast]);

  // 📤 Sidebar функции из legacy
  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  }, []);

  const handleSaveEvent = useCallback(async (eventData: any) => {
    try {
      if (selectedEvent?.id) {
        await handleUpdateEvent(selectedEvent.id, eventData);
      } else {
        await handleCreateEvent(eventData);
      }
      handleCloseSidebar();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  }, [selectedEvent, handleUpdateEvent, handleCreateEvent, handleCloseSidebar]);

  const handleViewDay = useCallback((date: string) => {
    navigate(`/day/${date}`);
  }, [navigate]);

  // Обработка кликов
  const handleDateCellClick = (dateStr: string) => {
    if (onDateClick) {
      onDateClick(dateStr);
    }
  };

  const handleEventClickInternal = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const eventId = event.id;
    const dateStr = event.startStr.split('T')[0];
    
    // Показываем sidebar для редактирования события
    setSelectedDate(dateStr);
    setSelectedEvent({ 
      ...event.extendedProps?.rawEvent!, 
      date: event.startStr,
      timeRange: event.extendedProps?.timeRange
    });
    setSidebarOpen(true);
    
    if (onEventClick) {
      onEventClick(eventId, dateStr);
    }
  };

  // Фильтрация событий
  const filteredEvents = formattedEvents.filter(event => {
    if (activeFilter !== 'all') {
      const eventType = event.extendedProps?.eventType;
      if (activeFilter.startsWith('type:')) {
        const filterType = activeFilter.split(':')[1];
        if (eventType !== filterType) return false;
      } else {
        // Другие фильтры (mine, shared, upcoming и т.д.)
        // Логика фильтрации...
      }
    }
    
    if (searchQuery) {
      return event.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return true;
  });

  // Drag & Drop для шаблонов
  useEffect(() => {
    const draggables: any[] = [];
    
    const createDraggable = (container: HTMLElement) => {
      try {
        return new Draggable(container, {
          itemSelector: '.js-template-item',
          eventData: (el) => ({
            title: el.getAttribute('data-title') || 'Событие',
            extendedProps: {
              eventType: el.getAttribute('data-type') || 'plan',
              templateId: el.getAttribute('data-template-id'),
              description: el.getAttribute('data-description') || '',
            },
            backgroundColor: el.getAttribute('data-color') || EVENT_TYPE_COLORS.plan,
            duration: el.getAttribute('data-duration') || null,
            allDay: el.getAttribute('data-is-all-day') === 'true',
          }),
        });
      } catch (error) {
        console.warn('Ошибка при создании Draggable:', error);
        return null;
      }
    };
    
    if (templateContainerRef.current) {
      const draggable = createDraggable(templateContainerRef.current);
      if (draggable) draggables.push(draggable);
    }
    
    if (customTemplatesRef.current) {
      const draggable = createDraggable(customTemplatesRef.current);
      if (draggable) draggables.push(draggable);
    }
    
    return () => {
      draggables.forEach(draggable => {
        if (draggable && typeof draggable.destroy === 'function') {
          try {
            draggable.destroy();
          } catch (error) {
            console.warn('Ошибка при уничтожении Draggable:', error);
          }
        }
      });
    };
  }, [templates]);

  // Render функция событий
  const renderEventContent = (eventInfo: EventContentArg) => {
    const event = eventInfo.event;
    const timeRange = event.extendedProps.timeRange;
    const barColor = event.backgroundColor || EVENT_TYPE_COLORS.plan;
    
    return (
      <div 
        className={styles.eventContent}
        style={{ 
          backgroundColor: barColor,
          borderLeft: `4px solid ${darken(barColor, 0.2)}`
        }}
      >
        <div className={styles.eventTitle}>
          {timeRange && <span className={styles.eventTime}>{timeRange}</span>}
          {event.title}
        </div>
      </div>
    );
  };

  // Мини-календарь данные
  const getMiniCalendarDays = (baseDate: Date) => {
    const result: Date[] = [];
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
  };

  const miniDays = getMiniCalendarDays(currentDate);
  const monthLabel = currentTitle || currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  // Шаблоны по умолчанию
  const defaultTemplates = Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => ({
    type,
    label: type,
    color
  }));

  if (eventsLoading && events.length === 0) {
    return (
      <div className={`${styles.calendarModule} ${className || ''}`}>
        <div className={styles.loading}>Загрузка календаря...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.calendarModule} ${className || ''}`}>
      <CalendarToolbar
        title={monthLabel}
        currentView={currentView}
        showFilters={showFilters}
        showList={showList}
        onPrevClick={goPrev}
        onNextClick={goNext}
        onTodayClick={goToday}
        onViewChange={setCurrentView}
        onFiltersToggle={() => setShowFilters(!showFilters)}
        onListToggle={() => setShowList(!showList)}
        onGenerateDate={() => setIsDateGeneratorOpen(true)}
        onAddEvent={() => handleDateCellClick(new Date().toISOString().split('T')[0])}
      />

      {showFilters && (
        <div className={styles.filtersPanel}>
          <CalendarFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>
      )}

      <div className={styles.content}>
        {showSidebar && (
          <aside className={styles.sidebar}>
            <MiniCalendar
              monthLabel={monthLabel}
              days={miniDays}
              currentDate={currentDate}
              onPrevClick={goPrev}
              onNextClick={goNext}
              onDateClick={gotoDate}
            />
            
            <EventTemplatesList
              templates={templates}
              defaultTemplates={defaultTemplates}
              onCreateTemplate={() => {/* Логика создания шаблона */}}
              onEditTemplate={() => {/* Логика редактирования */}}
              onDeleteTemplate={deleteTemplate}
              templateContainerRef={templateContainerRef}
              customTemplatesRef={customTemplatesRef}
            />
          </aside>
        )}

        <main className={styles.calendar}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={filteredEvents}
            locale="ru"
            firstDay={1}
            timeZone="local"
            height="100%"
            headerToolbar={false}
            editable={true}
            droppable={true}
            dayMaxEvents={3}
            eventDisplay="block"
            eventContent={renderEventContent}
            eventDrop={handleEventDrop}
            eventClick={handleEventClickInternal}
            dateClick={(info) => handleDateCellClick(info.dateStr)}
            eventDidMount={(info) => {
              // Добавляем контекстное меню на события
              info.el.addEventListener('contextmenu', (e: MouseEvent) => {
                e.preventDefault();
                const mockClickInfo = { event: info.event, jsEvent: e } as any;
                handleContextMenu(e, mockClickInfo);
              });
            }}
          />
        </main>
      </div>

      {/* 🎬 Story Viewer из legacy */}
      {isStoryViewerOpen && storyViewerDate && (
        <StoryViewer
          isOpen={isStoryViewerOpen}
          onClose={closeStoryMode}
          targetDate={storyViewerDate}
          events={events.filter(event => 
            event.start.split('T')[0] === storyViewerDate
          )}
        />
      )}

      {/* 📝 Контекстное меню из legacy */}
      {contextMenu.show && (
        <div 
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={handleContextMenuClose}
        >
          <button onClick={() => handleContextMenuAction('view')}>
            Посмотреть день
          </button>
          <button onClick={() => handleContextMenuAction('edit')}>
            Редактировать
          </button>
          <button onClick={() => handleContextMenuAction('story')}>
            Показать как сторис
          </button>
          <button onClick={() => handleContextMenuAction('delete')} className={styles.deleteButton}>
            Удалить
          </button>
        </div>
      )}

      {/* 💕 DateGenerator Modal из legacy */}
      {isDateGeneratorOpen && (
        <DateGeneratorModal
          isOpen={isDateGeneratorOpen}
          onClose={() => setIsDateGeneratorOpen(false)}
          onSubmit={handleDateGenerated}
          userId={userId}
        />
      )}

      {/* 📤 Event Sidebar из legacy */}
      {isSidebarOpen && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          eventData={selectedEvent}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          selectedDate={selectedDate}
          onViewDay={() => handleViewDay(selectedDate || new Date().toISOString().split('T')[0])}
        />
      )}
    </div>
  );
};
