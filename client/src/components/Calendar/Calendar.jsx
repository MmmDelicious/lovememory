import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import Sidebar from '../Sidebar/Sidebar';
import { FaCalendarAlt, FaThLarge, FaFileAlt, FaUsers, FaFolder, FaCog, FaChevronLeft, FaChevronRight, FaFilter, FaListUl, FaPlus } from 'react-icons/fa';
import { useEventMascot } from '../../context/EventMascotContext';
import { useDevice } from '../../hooks/useDevice';
import styles from './Calendar.module.css';
import CalendarFilters from './SearchAndFilter';
import { EVENT_TYPE_COLORS } from '../../hooks/useEvents';

const Calendar = ({ events, userId, onCreateEvent, onUpdateEvent, onDeleteEvent }) => {
  const navigate = useNavigate();
  const { isMobile } = useDevice();
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, event: null });
  const calendarRef = useRef(null);
  const calendarContainerRef = useRef(null);
  const templateContainerRef = useRef(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);
  const { hideMascot, registerMascotTargets, startMascotLoop, stopMascotLoop, clearMascotTargets } = useEventMascot();

  // Helper: hex -> hue for palette sorting
  const getHueFromHex = (hex) => {
    const clean = hex.replace('#','');
    const bigint = parseInt(clean.length === 3 ? clean.split('').map(x=>x+x).join('') : clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    const rNorm = r/255, gNorm = g/255, bNorm = b/255;
    const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
    let h = 0; const d = max - min;
    if (d === 0) h = 0;
    else if (max === rNorm) h = ((gNorm - bNorm) / d) % 6;
    else if (max === gNorm) h = (bNorm - rNorm) / d + 2;
    else h = (rNorm - gNorm) / d + 4;
    h = Math.round((h * 60 + 360) % 360);
    return h;
  };

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

  const sortedTypeEntries = useMemo(() => {
    return Object.entries(EVENT_TYPE_COLORS)
      .sort(([, c1], [, c2]) => getHueFromHex(c1) - getHueFromHex(c2));
  }, []);

  

  useEffect(() => {
    // Enable external drag from template list
    if (templateContainerRef.current) {
      // eslint-disable-next-line no-new
      new Draggable(templateContainerRef.current, {
        itemSelector: `.${styles.templateItem}`,
        eventData: (el) => ({
          title: el.getAttribute('data-title') || 'Событие',
          extendedProps: {
            eventType: el.getAttribute('data-type') || 'plan',
            isOwner: true,
            isShared: false,
          },
          backgroundColor: el.getAttribute('data-color') || '#D97A6C',
          borderColor: el.getAttribute('data-color') || '#D97A6C',
          duration: el.getAttribute('data-duration') || null,
          allDay: true,
        }),
      });
    }
  }, []);

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

  // Run mascot setup after updateMascotTargets is defined
  useEffect(() => {
    updateMascotTargets();
    startMascotLoop();

    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const handleDatesSet = (arg) => {
        updateMascotTargets();
        setCurrentDate(arg.view.currentStart);
        setCurrentTitle(arg.view?.title || '');
        setCurrentView(arg.view?.type || 'dayGridMonth');
      };
      calendarApi.on('datesSet', handleDatesSet);
    }

    return () => {
      stopMascotLoop();
      clearMascotTargets();
      const api = calendarRef.current?.getApi();
      if (api) {
        api.off('datesSet');
      }
    };
  }, [updateMascotTargets, startMascotLoop, stopMascotLoop, clearMascotTargets]);

  const handleInteraction = (handler) => (...args) => {
    hideMascot();
    if (document.activeElement) {
      document.activeElement.blur();
    }
    handler(...args);
  };

  const handleContextMenu = (event, clickInfo) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      event: clickInfo
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu({ show: false, x: 0, y: 0, event: null });
  };

  const handleContextMenuAction = (action) => {
    const { event } = contextMenu.event;
    
    switch (action) {
      case 'delete':
        handleDeleteEvent(event.id);
        break;
      case 'view':
        const eventDate = event.startStr.split('T')[0];
        navigate(`/day/${eventDate}`);
        break;
      case 'edit':
        setSelectedDate(event.startStr.split('T')[0]);
        setSelectedEvent({ 
          ...event.extendedProps.rawEvent, 
          date: event.startStr,
          timeRange: event.extendedProps.timeRange
        });
        setSidebarOpen(true);
        break;
    }
    
    handleContextMenuClose();
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

  const handleEventRightClick = (clickInfo) => {
    const event = new MouseEvent('contextmenu', {
      clientX: clickInfo.jsEvent.clientX,
      clientY: clickInfo.jsEvent.clientY,
      bubbles: true
    });
    handleContextMenu(event, clickInfo);
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
      
      const updateData = {
        event_date: newStart.toISOString(),
      };
      
      if (newEnd) {
        updateData.end_date = newEnd.toISOString();
      }
      
      await onUpdateEvent(event.id, updateData);
    } catch (error) {
      console.error("Ошибка при обновлении даты события:", error);
      dropInfo.revert();
    }
  };

  const renderEventContent = (eventInfo) => {
    const raw = eventInfo.event.extendedProps?.rawEvent;
    let timeLabel = '';
    if (raw?.event_date) {
      const start = new Date(raw.event_date);
      const end = raw.end_date ? new Date(raw.end_date) : null;
      const startIsMidnight = start.getHours() === 0 && start.getMinutes() === 0;
      const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (end) {
        timeLabel = `${fmt(start)} - ${fmt(end)}`;
      } else if (!startIsMidnight) {
        timeLabel = fmt(start);
      }
    }

    const barColor = eventInfo.event.backgroundColor || '#D97A6C';
    const darken = (hex, amt = 15) => {
      const c = hex.replace('#','');
      const num = parseInt(c.length === 3 ? c.split('').map(x=>x+x).join('') : c, 16);
      let r = (num >> 16) - amt; if (r < 0) r = 0;
      let g = ((num >> 8) & 0x00FF) - amt; if (g < 0) g = 0;
      let b = (num & 0x0000FF) - amt; if (b < 0) b = 0;
      return `#${(r<<16 | g<<8 | b).toString(16).padStart(6,'0')}`;
    };
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

  const matchesFilter = (event) => {
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
    if (document.activeElement) {
      document.activeElement.blur();
    }
  };

  const gotoDate = (date) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.gotoDate(date);
    }
  };

  const goPrev = () => calendarRef.current?.getApi()?.prev();
  const goNext = () => calendarRef.current?.getApi()?.next();
  const goToday = () => calendarRef.current?.getApi()?.today();
  const changeView = (view) => calendarRef.current?.getApi()?.changeView(view);

  const handleAddQuick = () => {
    const isoDate = new Date(currentDate);
    isoDate.setHours(0, 0, 0, 0);
    const dateStr = isoDate.toISOString().slice(0, 10);
    setSelectedDate(dateStr);
    setSelectedEvent({ title: '', description: '', date: dateStr });
    setSidebarOpen(true);
  };

  const monthLabel = useMemo(() => {
    if (currentTitle) return currentTitle;
    try {
      return currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    } catch { return ''; }
  }, [currentDate, currentTitle]);

  const getMiniCalendarDays = useCallback((baseDate) => {
    const result = [];
    const firstOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const startDay = (firstOfMonth.getDay() + 6) % 7; // 0..6, Monday-first
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

  // Receiving external dropped template
  const handleEventReceive = (info) => {
    try {
      const type = info.event.extendedProps?.eventType || 'plan';
      const dateStr = info.event.startStr.split('T')[0];
      setSelectedDate(dateStr);
      setSelectedEvent({
        title: info.event.title || '',
        description: '',
        date: dateStr,
        event_type: type,
      });
      setSidebarOpen(true);
    } finally {
      // Удаляем временное событие календаря, чтобы не было дубля
      info.event.remove();
    }
  };

  return (
    <div className={styles.plannerLayout} ref={calendarContainerRef} onClick={handleCalendarContainerClick}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          <div className={styles.miniCalendar}>
            <div className={styles.miniHeader}>
              <span className={styles.miniTitle}>{monthLabel}</span>
              <div className={styles.calendarNav}>
                <button className={styles.navArrow} aria-label="Предыдущий" onClick={goPrev}><FaChevronLeft /></button>
                <button className={styles.navArrow} aria-label="Следующий" onClick={goNext}><FaChevronRight /></button>
              </div>
            </div>
            <div className={styles.miniGrid}>
              <div className={styles.miniWeekdays}>
                {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className={styles.miniDates}>
                {miniDays.map(d => {
                  const isToday = new Date().toDateString() === d.toDateString();
                  const isOtherMonth = d.getMonth() !== currentDate.getMonth();
                  return (
                    <button
                      key={d.toISOString()}
                      className={`${styles.miniDate} ${isOtherMonth ? styles.otherMonth : ''} ${isToday ? styles.today : ''}`}
                      onClick={() => gotoDate(d)}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* External templates for drag & drop */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionHeader}><h3>Шаблоны событий</h3></div>
            <div className={styles.templateList} ref={templateContainerRef}>
              {sortedTypeEntries.map(([type, color]) => (
                <div
                  key={type}
                  className={styles.templateItem}
                  draggable
                  data-type={type}
                  data-title={TYPE_LABELS[type] || 'Событие'}
                  data-color={color}
                  data-duration={type === 'date' ? '120' : ''}
                  title="Перетащите на календарь"
                >
                  <span className={styles.categoryDot} style={{ backgroundColor: color }} />
                  <span className={styles.templateName}>{TYPE_LABELS[type] || type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <div className={styles.sectionHeader}><h3>Мои календари</h3></div>
            <div className={styles.calendarList}>
              <button
                className={`${styles.calendarItemBtn} ${filter === 'mine' ? styles.active : ''}`}
                onClick={() => setFilter(filter === 'mine' ? 'all' : 'mine')}
              >
                <span className={styles.calendarColor} style={{ backgroundColor: '#D97A6C' }}></span>
                <span className={styles.calendarName}>Мои</span>
              </button>
              <button
                className={`${styles.calendarItemBtn} ${filter === 'shared' ? styles.active : ''}`}
                onClick={() => setFilter(filter === 'shared' ? 'all' : 'shared')}
              >
                <span className={styles.calendarColor} style={{ backgroundColor: '#EADFD8' }}></span>
                <span className={styles.calendarName}>Общие</span>
              </button>
            </div>
          </div>

         
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.calendarHeaderMain}>
          <div className={styles.calendarTitle}>
            <h1>{monthLabel}</h1>
            <div className={styles.calendarNav}>
              <button className={styles.navArrow} aria-label="Предыдущий" onClick={goPrev}><FaChevronLeft /></button>
              <button className={styles.navArrow} aria-label="Следующий" onClick={goNext}><FaChevronRight /></button>
            </div>
          </div>
          <div className={styles.calendarActions}>
            <div className={styles.viewSwitch}>
              <button className={`${styles.viewBtn} ${currentView==='dayGridMonth'?styles.viewActive:''}`} onClick={() => changeView('dayGridMonth')}>Месяц</button>
              <button className={`${styles.viewBtn} ${currentView==='dayGridWeek'?styles.viewActive:''}`} onClick={() => changeView('dayGridWeek')}>Неделя</button>
              <button className={`${styles.viewBtn} ${currentView==='dayGridDay'?styles.viewActive:''}`} onClick={() => changeView('dayGridDay')}>День</button>
            </div>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={goToday}>Сегодня</button>
            <button className={styles.iconBtn} title="Фильтры" onClick={() => setShowFilters(v => !v)}><FaFilter /></button>
            <button className={styles.iconBtn} title="Список" onClick={() => setShowList(v => !v)}><FaListUl /></button>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAddQuick}><FaPlus /> Добавить</button>
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
                  .sort((a,b) => new Date(a.start) - new Date(b.start))
                  .map(ev => (
                    <li key={ev.id} className={styles.eventListItem} onClick={() => handleEventClick({ event: { ...ev, extendedProps: ev.extendedProps, startStr: ev.start } })}>
                      <span className={styles.eventListDot} style={{ backgroundColor: ev.backgroundColor }} />
                      <span className={styles.eventListTitle}>{ev.title}</span>
                      <span className={styles.eventListDate}>{new Date(ev.start).toLocaleDateString('ru-RU')}</span>
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
          {filteredEvents.length === 0 && events.length === 0 ? (
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px',
              fontSize: '16px', color: '#666' }}>
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
              timeZone="local"
              showNonCurrentDates={true}
              fixedWeekCount={false}
              headerToolbar={false}
              buttonText={{ today: 'сегодня', month: 'месяц', week: 'неделя', day: 'день', list: 'список' }}
              height="100%"
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
                info.el.addEventListener('contextmenu', (e) => {
                  e.preventDefault();
                  handleContextMenu(e, { event: info.event, jsEvent: e });
                });
              }}
            />
          )}
        </div>
      </main>

      {contextMenu.show && (
        <div 
          className={styles.contextMenu}
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }}
        >
          <div className={styles.contextMenuItem} onClick={() => handleContextMenuAction('edit')}>✏️ Редактировать</div>
          <div className={styles.contextMenuItem} onClick={() => handleContextMenuAction('view')}>👁️ Посмотреть день</div>
          <div className={styles.contextMenuItem} onClick={() => handleContextMenuAction('delete')}>🗑️ Удалить событие</div>
        </div>
      )}

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