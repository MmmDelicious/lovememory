import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import type { EventDropArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import Sidebar from '../Sidebar/Sidebar';
import StoryViewer from '../StoryViewer/StoryViewer';
import { FaChevronLeft, FaChevronRight, FaFilter, FaListUl, FaPlus } from 'react-icons/fa';
import { useMascot } from '../../context/MascotContext';
import { toast } from '../../context/ToastContext';
import styles from './Calendar.module.css';
import CalendarFilters from './SearchAndFilter';
import CalendarSidebar from './CalendarSidebar';
import { EVENT_TYPE_COLORS } from '../../hooks/useEvents';
import { getHueFromHex, darken } from '../../utils/color';
import type { EventTemplateData } from '../EventTemplateModal/EventTemplateModal';
import memoriesService from '../../services/memories.service';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor?: string;
  borderColor?: string;
  editable?: boolean;
  extendedProps?: {
    rawEvent?: {
      id: string;
      title: string;
      description?: string;
      event_date: string;
      end_date?: string;
      event_type: string;
      isShared?: boolean;
      is_recurring?: boolean;
      recurrence_rule?: any;
    };
    eventType?: string;
    isOwner?: boolean;
    isShared?: boolean;
    timeRange?: string;
  };
}

interface CalendarProps {
  events: CalendarEvent[];
  userId: string;
  onCreateEvent: (eventData: any) => Promise<void>;
  onUpdateEvent: (eventId: string, eventData: any) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
  customTemplates?: EventTemplateData[];
  onCreateTemplate?: () => void;
  onEditTemplate?: (template: EventTemplateData) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onDuplicateTemplate?: (template: EventTemplateData) => void;
}

interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  event: EventClickArg | null;
}

interface EventData {
  id?: string;
  title: string;
  description?: string;
  date: string;
  event_date: string;
  end_date?: string;
  event_type?: string;
  isShared?: boolean;
  is_recurring?: boolean;
  recurrence_rule?: any;
  timeRange?: string;
}

interface DateClickArg {
  dateStr: string;
  date: Date;
  allDay: boolean;
}

interface EventReceiveArg {
  event: {
    id: string;
    title: string;
    startStr: string;
    extendedProps?: any;
    remove: () => void;
  };
}

const Calendar: React.FC<CalendarProps> = ({ 
  events, 
  userId, 
  onCreateEvent, 
  onUpdateEvent, 
  onDeleteEvent,
  customTemplates = [],
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate
}) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ show: false, x: 0, y: 0, event: null });
  const calendarRef = useRef<FullCalendar>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const templateContainerRef = useRef<HTMLDivElement>(null);
  const customTemplatesRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyDate, setStoryDate] = useState<string>('');
  const [memoryStoryData, setMemoryStoryData] = useState<any>(null);
  
  const { hideMascot, registerMascotTargets, startMascotLoop, stopMascotLoop, clearMascotTargets } = useMascot();
  
  const TYPE_LABELS: Record<string, string> = {
    plan: 'План',
    memory: 'Воспоминание',
    anniversary: 'Годовщина',
    birthday: 'День рождения',
    travel: 'Путешествие',
    date: 'Свидание',
    gift: 'Подарок',
    deadline: 'Дедлайн',
  };

  const sortedTypeEntries = useMemo(() => {
    return Object.entries(EVENT_TYPE_COLORS)
      .sort(([, c1], [, c2]) => getHueFromHex(c1) - getHueFromHex(c2));
  }, []);



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
              isOwner: true,
              isShared: el.getAttribute('data-is-shared') === 'true',
              templateId: el.getAttribute('data-template-id'),
              description: el.getAttribute('data-description') || '',
            },
            backgroundColor: el.getAttribute('data-color') || '#D97A6C',
            borderColor: el.getAttribute('data-color') || '#D97A6C',
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
      if (draggable) {
        draggables.push(draggable);
      }
    }
    
    if (customTemplatesRef.current) {
      const draggable = createDraggable(customTemplatesRef.current);
      if (draggable) {
        draggables.push(draggable);
      }
    }
    
    return () => {
      stopMascotLoop();
      clearMascotTargets();
      
      draggables.forEach(draggable => {
        if (draggable && typeof draggable.destroy === 'function') {
          try {
            draggable.destroy();
          } catch (error) {
            console.warn('Ошибка при уничтожении Draggable:', error);
          }
        }
      });
      
      draggables.length = 0;
    };
  }, [stopMascotLoop, clearMascotTargets]);


  useEffect(() => {
    return () => {
      stopMascotLoop();
      clearMascotTargets();
    };
  }, [stopMascotLoop, clearMascotTargets]);



  const openStoryMode = useCallback((date: string) => {
    const dayEvents = events.filter(event => 
      event.start.split('T')[0] === date
    );
    
    if (dayEvents.length === 0) {
      toast.warning('В этот день нет событий для показа', 'Story mode');
      return;
    }
    
    setStoryDate(date);
    setStoryViewerOpen(true);
  }, [events, toast]);

  const closeStoryMode = useCallback(() => {
    setStoryViewerOpen(false);
    setTimeout(() => {
      setStoryDate('');
      setMemoryStoryData(null);
    }, 300);
  }, []);

  const updateMascotTargets = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi || events.length === 0) {
      registerMascotTargets([]);
      return;
    }
    
    const calendarEl = (calendarApi as any).el as HTMLElement;
    const dayCells = calendarEl.querySelectorAll('[data-date]');
    const cellMap = new Map<string, string>();
    
    dayCells.forEach((cell: any) => {
      const element = cell as HTMLElement;
      const date = element.getAttribute('data-date');
      if (date) {
    
        const elementId = `calendar-cell-${date}`;
        element.id = elementId;
        cellMap.set(date, elementId);
      }
    });
    
    const allEvents = calendarApi.getEvents();
    const targets = allEvents.reduce<any[]>((acc, event) => {
      const elementId = cellMap.get(event.startStr.split('T')[0]);
      if (elementId) {
        acc.push({
          page: 'dashboard',
          data: { event: event.extendedProps.rawEvent },
          element: document.getElementById(elementId),
          containerRef: calendarContainerRef,
          onActionClick: () => {
            const eventDate = event.startStr.split('T')[0];
            openStoryMode(eventDate);
          },
        });
      }
      return acc;
    }, []);
    
    registerMascotTargets(targets);
    
    // Запускаем цикл маскотов после регистрации целей
    if (targets.length > 0) {
      startMascotLoop();
    }
  }, [events, registerMascotTargets, startMascotLoop, openStoryMode]);

  // Инициализация маскотов когда события или календарь загружаются
  useEffect(() => {
    if (events.length > 0) {
      // Небольшая задержка чтобы FullCalendar успел отрендериться
      const timer = setTimeout(() => {
        updateMascotTargets();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [events, updateMascotTargets]);



  const handleInteraction = <T extends any[]>(handler: (...args: T) => void) => (...args: T) => {
    hideMascot();
    if (document.activeElement && 'blur' in document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
    handler(...args);
  };

  const handleContextMenu = (event: React.MouseEvent, clickInfo: EventClickArg) => {
    event.preventDefault();
    const { clientX, clientY } = event;
    const menuWidth = 180;
    const menuHeight = 110;
    const x = clientX + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 5 : clientX;
    const y = clientY + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 5 : clientY;
    setContextMenu({ show: true, x, y, event: clickInfo });
  };

  const handleContextMenuClose = () => {
    setContextMenu({ show: false, x: 0, y: 0, event: null });
  };

  const handleContextMenuAction = (action: 'delete' | 'view' | 'edit' | 'story') => {
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
  };



  useEffect(() => {
    const handleShowMemoryStory = async (event: any) => {
      const { memoryCollection } = event.detail;
      if (!memoryCollection || memoryCollection.length === 0) return;
      
      try {
        const memoryStory = await memoriesService.createMemoryStory(memoryCollection);
        setMemoryStoryData(memoryStory);
        setStoryDate('');
        setStoryViewerOpen(true);
      } catch (error) {
        toast.error('Не удалось загрузить воспоминание', 'Ошибка');
      }
    };
    
    window.addEventListener('showMemoryStory', handleShowMemoryStory);
    return () => window.removeEventListener('showMemoryStory', handleShowMemoryStory);
  }, [toast]);

  const handleDayCellDidMount = (arg: any) => {
    const dateStr = arg.date.toISOString().split('T')[0];
    const hasEvents = events.some(event => event.start.split('T')[0] === dateStr);
    if (hasEvents) {
      arg.el.classList.add('fc-day-with-events');
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        handleContextMenuClose();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.show]);

  const handleDateClick = (arg: DateClickArg) => {
    if ((arg as any).jsEvent?.shiftKey) {
      openStoryMode(arg.dateStr);
      return;
    }
    
    setSelectedDate(arg.dateStr);
    const eventOnDay = events.find(e => e.start.split('T')[0] === arg.dateStr);
    
    if (eventOnDay?.extendedProps?.rawEvent) {
      setSelectedEvent({ ...eventOnDay.extendedProps.rawEvent, date: arg.dateStr });
    } else {
      const { startISO, endISO } = findFirstFreeOneHourSlot(arg.dateStr);
      setSelectedEvent({ title: '', description: '', date: arg.dateStr, event_date: startISO, end_date: endISO });
    }
    
    setSidebarOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (!clickInfo.event.extendedProps?.rawEvent) return;
    
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

  const handleSaveEvent = async (eventData: EventData) => {
    try {
      const dataToSave = {
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.event_date,
        end_date: eventData.end_date,
        event_type: eventData.event_type,
        isShared: eventData.isShared,
        is_recurring: eventData.is_recurring,
        recurrence_rule: eventData.recurrence_rule,
        source: 'USER_CREATED' // Событие создано пользователем вручную
      };
      
      if (eventData.id) {
        await onUpdateEvent(eventData.id, dataToSave);
      } else {
        await onCreateEvent(dataToSave);
      }
      
      handleCloseSidebar();
    } catch (error) {
      toast.error('Не удалось сохранить событие', 'Ошибка');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await onDeleteEvent(eventId);
      handleCloseSidebar();
    } catch (error) {
      toast.error('Не удалось удалить событие', 'Ошибка');
    }
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    if (!event.extendedProps?.rawEvent) return;
    
    try {
      const oldStart = new Date(event.extendedProps.rawEvent.event_date);
      const oldEnd = event.extendedProps.rawEvent.end_date ? new Date(event.extendedProps.rawEvent.end_date) : null;
      const newStart = event.start!;
      let newEnd = null;
      
      if (oldEnd) {
        const duration = oldEnd.getTime() - oldStart.getTime();
        newEnd = new Date(newStart.getTime() + duration);
      }
      
      const updateData: any = {
        event_date: newStart.toISOString(),
      };
      
      if (newEnd) {
        updateData.end_date = newEnd.toISOString();
      }
      
      await onUpdateEvent(event.id, updateData);
    } catch (error) {
      dropInfo.revert();
      toast.error('Не удалось переместить событие', 'Ошибка');
    }
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const raw = eventInfo.event.extendedProps?.rawEvent;
    let timeLabel = '';
    
    if (raw?.event_date) {
      const start = new Date(raw.event_date);
      const end = raw.end_date ? new Date(raw.end_date) : null;
      const startIsMidnight = start.getHours() === 0 && start.getMinutes() === 0;
      const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (end) {
        timeLabel = `${fmt(start)} - ${fmt(end)}`;
      } else if (!startIsMidnight) {
        timeLabel = fmt(start);
      }
    }
    
    const barColor = eventInfo.event.backgroundColor || '#D97A6C';
    const style = {
      backgroundColor: barColor,
      borderLeft: `4px solid ${darken(barColor, 25)}`,
      color: '#fff'
    };
    
    return (
      <div className={styles.eventContentWrapper} style={style}>
        <div className={styles.eventTitle}>
          {timeLabel && <span className={styles.eventTime}>{timeLabel}</span>}
          {eventInfo.event.title}
        </div>
      </div>
    );
  };

  const getDateFilters = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    return { now, startOfWeek, endOfWeek, startOfMonth, endOfMonth };
  };

  const matchesFilter = (event: CalendarEvent) => {
    const { now, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = getDateFilters();
    const eventDate = new Date(event.start);
    eventDate.setHours(0, 0, 0, 0);
    
    if (filter.startsWith('type:')) {
      const type = filter.split(':')[1];
      return event.extendedProps?.eventType === type;
    }
    
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

  const handleCalendarContainerClick = () => {
    if (document.activeElement && 'blur' in document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
  };

  const gotoDate = (date: Date) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.gotoDate(date);
    }
  };

  const goPrev = () => calendarRef.current?.getApi()?.prev();
  const goNext = () => calendarRef.current?.getApi()?.next();
  const goToday = () => calendarRef.current?.getApi()?.today();
  const changeView = (view: string) => calendarRef.current?.getApi()?.changeView(view);

  const handleAddQuick = () => {
    const isoDate = new Date(currentDate);
    isoDate.setHours(0, 0, 0, 0);
    const dateStr = isoDate.toISOString().slice(0, 10);
    setSelectedDate(dateStr);
    const { startISO, endISO } = findFirstFreeOneHourSlot(dateStr);
    setSelectedEvent({ title: '', description: '', date: dateStr, event_date: startISO, end_date: endISO });
    setSidebarOpen(true);
  };

  const monthLabel = useMemo(() => {
    if (currentTitle) return currentTitle;
    return currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  }, [currentDate, currentTitle]);

  const findFirstFreeOneHourSlot = (dateStr: string) => {
    const TARGET_START_HOUR = 8; // базовое время 08:00
    const eventsOnDay = events
      .filter(e => e.start.split('T')[0] === dateStr)
      .map(e => ({
        start: new Date(e.extendedProps?.rawEvent?.event_date || e.start),
        end: e.extendedProps?.rawEvent?.end_date ? new Date(e.extendedProps.rawEvent.end_date) : null,
      }))
      .sort((a,b) => a.start.getTime() - b.start.getTime());
    
    let slotStart = new Date(`${dateStr}T${String(TARGET_START_HOUR).padStart(2,'0')}:00:00`);
    let slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
    
    const overlaps = (aStart: Date, aEnd: Date | null, bStart: Date, bEnd: Date | null) => {
      const endA = aEnd || new Date(aStart.getTime() + 60*60*1000);
      const endB = bEnd || new Date(bStart.getTime() + 60*60*1000);
      return aStart < endB && bStart < endA;
    };
    
    for (const ev of eventsOnDay) {
      if (overlaps(slotStart, slotEnd, ev.start, ev.end)) {
        const nextStart = ev.end ? new Date(ev.end) : new Date(ev.start.getTime() + 60*60*1000);
        nextStart.setMinutes(0,0,0);
        slotStart = nextStart;
        slotEnd = new Date(slotStart.getTime() + 60*60*1000);
      }
    }
    
    return { startISO: slotStart.toISOString(), endISO: slotEnd.toISOString() };
  };

  const getMiniCalendarDays = useCallback((baseDate: Date) => {
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
  }, []);

  const miniDays = useMemo(() => getMiniCalendarDays(currentDate), [getMiniCalendarDays, currentDate]);

  const handleEventReceive = (info: EventReceiveArg) => {
    try {
      const type = info.event.extendedProps?.eventType || 'plan';
      const dateStr = info.event.startStr.split('T')[0];
      const templateId = info.event.extendedProps?.templateId;
      
      setSelectedDate(dateStr);
      
      const { startISO, endISO } = findFirstFreeOneHourSlot(dateStr);
      let eventData: EventData;
      
      if (templateId && customTemplates.length > 0) {
        const template = customTemplates.find(t => t.id === templateId);
        if (template) {
          eventData = {
            title: template.default_title || template.name,
            description: template.default_description || '',
            date: dateStr,
            event_type: template.event_type,
            event_date: template.is_all_day ? `${dateStr}T00:00:00` : startISO,
            end_date: template.is_all_day ? undefined : endISO
          };
        } else {
          eventData = {
            title: info.event.title || '',
            description: '',
            date: dateStr,
            event_type: type,
            event_date: startISO,
            end_date: endISO
          };
        }
      } else {
        eventData = {
          title: info.event.title || '',
          description: '',
          date: dateStr,
          event_type: type,
          event_date: startISO,
          end_date: endISO
        };
      }
      
      setSelectedEvent(eventData);
      setSidebarOpen(true);
    } finally {
      info.event.remove();
    }
  };

  return (
    <div className={styles.plannerLayout} ref={calendarContainerRef} onClick={handleCalendarContainerClick}>
      <aside className={styles.sidebar}>
        <CalendarSidebar
          onClose={() => {}}
          monthLabel={monthLabel}
          goPrev={goPrev}
          goNext={goNext}
          miniDays={miniDays}
          currentDate={currentDate}
          gotoDate={gotoDate}
          templateContainerRef={templateContainerRef}
          customTemplatesRef={customTemplatesRef}
          sortedTypeEntries={sortedTypeEntries}
          TYPE_LABELS={TYPE_LABELS}
          filter={filter}
          setFilter={setFilter}
          customTemplates={customTemplates}
          onCreateTemplate={onCreateTemplate}
          onEditTemplate={onEditTemplate}
          onDeleteTemplate={onDeleteTemplate}
          onDuplicateTemplate={onDuplicateTemplate}
        />
      </aside>
      
      <main className={styles.mainContent}>
        <div className={styles.calendarHeaderMain}>
          <div className={styles.calendarTitle}>
            <h1>{monthLabel}</h1>
            <div className={`${styles.calendarNav} ${styles.mainNav}`}>
              <button className={styles.navArrow} aria-label="Предыдущий" onClick={goPrev}>
                <FaChevronLeft />
              </button>
              <button className={styles.navArrow} aria-label="Следующий" onClick={goNext}>
                <FaChevronRight />
              </button>
            </div>
          </div>
          
          <div className={styles.calendarActions}>
            <div className={styles.viewSwitch}>
              <button 
                className={`${styles.viewBtn} ${currentView==='dayGridMonth' ? styles.viewActive : ''}`} 
                onClick={() => changeView('dayGridMonth')}
              >
                Месяц
              </button>
              <button 
                className={`${styles.viewBtn} ${currentView==='dayGridWeek' ? styles.viewActive : ''}`} 
                onClick={() => changeView('dayGridWeek')}
              >
                Неделя
              </button>
              <button 
                className={`${styles.viewBtn} ${currentView==='dayGridDay' ? styles.viewActive : ''}`} 
                onClick={() => changeView('dayGridDay')}
              >
                День
              </button>
            </div>
            
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={goToday}>
              Сегодня
            </button>
            
            <button 
              className={styles.iconBtn} 
              title="Фильтры" 
              onClick={() => setShowFilters(v => !v)}
            >
              <FaFilter />
            </button>
            
            <button 
              className={styles.iconBtn} 
              title="Список" 
              onClick={() => setShowList(v => !v)}
            >
              <FaListUl />
            </button>
            
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAddQuick}>
              <FaPlus /> Добавить
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className={styles.filtersWrapper}>
            <CalendarFilters activeFilter={filter} onFilterChange={(f) => setFilter(f)} />
          </div>
        )}
        
        {showList && (
          <div className={styles.eventListPanel}>
            {filteredEvents.length === 0 ? (
              <div className={styles.eventListEmpty}>Нет событий</div>
            ) : (
              <ul className={styles.eventList}>
                {filteredEvents
                  .slice()
                  .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                  .map(ev => (
                    <li 
                      key={ev.id} 
                      className={styles.eventListItem} 
                      onClick={() => {
                        const mockClickInfo = {
                          event: { 
                            ...ev, 
                            extendedProps: ev.extendedProps, 
                            startStr: ev.start 
                          }
                        } as any;
                        handleEventClick(mockClickInfo);
                      }}
                    >
                      <span className={styles.eventListDot} style={{ backgroundColor: ev.backgroundColor }} />
                      <span className={styles.eventListTitle}>{ev.title}</span>
                      <span className={styles.eventListDate}>
                        {new Date(ev.start).toLocaleDateString('ru-RU')}
                      </span>
                      {ev.extendedProps?.timeRange && (
                        <span className={styles.eventListTime}>{ev.extendedProps.timeRange}</span>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
        
        <div className={styles.calendarWrapper}>
          <FullCalendar
            ref={calendarRef}
            key={currentView} 
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView={'dayGridMonth'}
            weekends={true}
            events={filteredEvents}
            locale="ru"
            firstDay={1}
            timeZone="local"
            showNonCurrentDates={true}
            fixedWeekCount={false}
            headerToolbar={false}
            buttonText={{ today: 'сегодня', month: 'месяц', week: 'неделя', day: 'день', list: 'список' }}
            height="100%"
            eventDisplay="block"
            editable={true}
            droppable={true}
            expandRows={true}
            dayMaxEventRows={3}
            dayMaxEvents={true}
            eventReceive={handleInteraction(handleEventReceive)}
            eventDrop={handleInteraction(handleEventDrop)}
            dateClick={handleInteraction(handleDateClick)}
            eventClick={handleInteraction(handleEventClick)}
            eventContent={renderEventContent}
            eventClassNames={(arg) => [arg.event.extendedProps.isOwner ? styles.eventMine : styles.eventPartner]}
            eventDidMount={(info) => {
              info.el.addEventListener('contextmenu', (e: MouseEvent) => {
                e.preventDefault();
                const mockClickInfo = { event: info.event, jsEvent: e } as any;
                handleContextMenu(e as any, mockClickInfo);
              });
            }}
            dayCellDidMount={handleDayCellDidMount}
          />
        </div>
      </main>
      
      {contextMenu.show && (
        <div 
          className={styles.contextMenu}
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1100 }}
        >
          <div className={styles.contextMenuItem} onClick={() => handleContextMenuAction('edit')}>
            ✏️ Редактировать
          </div>
          <div className={styles.contextMenuItem} onClick={() => handleContextMenuAction('view')}>
            👁️ Посмотреть день
          </div>
          <div className={styles.contextMenuItem} onClick={() => handleContextMenuAction('story')}>
            🎬 Посмотреть Stories
          </div>
          <div className={styles.contextMenuItem} onClick={() => handleContextMenuAction('delete')}>
            🗑️ Удалить событие
          </div>
        </div>
      )}
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={handleCloseSidebar}
        eventData={selectedEvent as any}
        onSave={handleSaveEvent as any}
        onDelete={handleDeleteEvent}
        selectedDate={selectedDate}
        onViewDay={handleViewDay}
      />
      
      <StoryViewer
        date={storyDate}
        memoryData={memoryStoryData}
        isOpen={storyViewerOpen}
        onClose={closeStoryMode}
      />
    </div>
  );
};

export default Calendar;

