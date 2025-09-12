import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventDropArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import styles from './Calendar.module.css';

interface CalendarMainProps {
  events: any[];
  viewMode: string;
  onEventDrop: (dropInfo: EventDropArg) => void;
  onEventClick: (clickInfo: EventClickArg) => void;
  onDateClick: (dateInfo: any) => void;
  onDatesSet: (dateInfo: any) => void;
}

/**
 * Основная часть календаря с FullCalendar
 * Вынесена из монстра Calendar.tsx
 */
const CalendarMain: React.FC<CalendarMainProps> = ({
  events,
  viewMode,
  onEventDrop,
  onEventClick,
  onDateClick,
  onDatesSet
}) => {
  const calendarRef = useRef<FullCalendar>(null);

  const renderEventContent = (eventInfo: EventContentArg) => {
    const event = eventInfo.event;
    const timeRange = event.extendedProps.timeRange;
    
    return (
      <div className={styles.eventContent}>
        <div className={styles.eventTitle}>
          {event.title}
        </div>
        {timeRange && (
          <div className={styles.eventTime}>
            {timeRange}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.calendarMain}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView={viewMode}
        events={events}
        locale="ru"
        firstDay={1}
        height="auto"
        headerToolbar={false}
        dayMaxEvents={3}
        eventDisplay="block"
        eventContent={renderEventContent}
        eventDrop={onEventDrop}
        eventClick={onEventClick}
        dateClick={onDateClick}
        datesSet={onDatesSet}
        editable={true}
        droppable={true}
        dayHeaderFormat={{ weekday: 'short' }}
        eventClassNames={(arg) => {
          const rawEvent = arg.event.extendedProps.rawEvent;
          const classes = [styles.calendarEvent];
          
          if (rawEvent?.isShared) {
            classes.push(styles.sharedEvent);
          }
          
          if (!arg.event.extendedProps.isOwner) {
            classes.push(styles.readOnlyEvent);
          }
          
          return classes;
        }}
      />
    </div>
  );
};

export default CalendarMain;

