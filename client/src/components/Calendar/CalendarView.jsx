import React, { useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEventMascot } from '../../context/EventMascotContext';
import { darken } from '../../utils/color';
import styles from './CalendarView.module.css';

const CalendarView = ({
  calendarRef,
  events,
  initialView,
  handleEventReceive,
  handleEventDrop,
  handleDateClick,
  handleEventClick,
  handleContextMenu,
}) => {
  const containerRef = useRef(null);
  const { hideMascot, registerMascotTargets, clearMascotTargets, startMascotLoop, stopMascotLoop } = useEventMascot();

  const updateMascotTargets = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (!api) {
      registerMascotTargets([]);
      return;
    }

    const dayCells = api.el.querySelectorAll('[data-date]');
    const cellMap = new Map();
    dayCells.forEach((cell) => {
      cellMap.set(cell.getAttribute('data-date'), cell);
    });

    const allEvents = api.getEvents();
    const targets = allEvents.reduce((acc, event) => {
      const dayCell = cellMap.get(event.startStr.split('T')[0]);
      if (dayCell) {
        acc.push({
          page: 'dashboard',
          data: { event: event.extendedProps.rawEvent },
          element: dayCell,
          containerRef,
          onActionClick: () => handleEventClick({ event }),
        });
      }
      return acc;
    }, []);
    registerMascotTargets(targets);
  }, [calendarRef, registerMascotTargets, handleEventClick]);

  useEffect(() => {
    updateMascotTargets();
    startMascotLoop();

    const api = calendarRef.current?.getApi();
    if (api) {
      const onDatesSet = () => updateMascotTargets();
      api.on('datesSet', onDatesSet);
      return () => {
        api.off('datesSet', onDatesSet);
      };
    }
    return () => {};
  }, [updateMascotTargets, startMascotLoop]);

  useEffect(() => {
    return () => {
      stopMascotLoop();
      clearMascotTargets();
    };
  }, [stopMascotLoop, clearMascotTargets]);

  const withHide = (handler) => (...args) => {
    hideMascot();
    if (typeof handler === 'function') handler(...args);
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

  return (
    <div className={styles.calendarWrapper} ref={containerRef}>
      <FullCalendar
        ref={calendarRef}
        key={initialView}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView={initialView}
        weekends={true}
        events={events}
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
        eventReceive={withHide(handleEventReceive)}
        eventDrop={withHide(handleEventDrop)}
        dateClick={withHide(handleDateClick)}
        eventClick={withHide(handleEventClick)}
        eventContent={renderEventContent}
        eventClassNames={(arg) => [arg.event.extendedProps.isOwner ? styles.eventMine : styles.eventPartner]}
        eventDidMount={(info) => {
          info.el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            handleContextMenu(e, { event: info.event, jsEvent: e });
          });
        }}
      />
    </div>
  );
};

export default CalendarView;