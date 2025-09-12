import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarModule } from '../../modules';
import { useAuth } from '../../../../modules/auth/hooks/useAuth';
import styles from './CalendarPage.module.css';

/**
 * Тонкая страница календаря
 * Содержит только навигационную логику, всю бизнес-логику делегирует модулю CalendarModule
 */
const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Обработчики навигации
  const handleEventClick = (eventId: string, date: string) => {
    navigate(`/day/${date}`);
  };

  const handleDateClick = (date: string) => {
    navigate(`/day/${date}`);
  };

  const handleCreateEvent = (eventData: any) => {
    // Здесь можно добавить дополнительную логику после создания события
    console.log('Event created:', eventData);
  };

  const handleUpdateEvent = (eventId: string, eventData: any) => {
    // Здесь можно добавить дополнительную логику после обновления события
    console.log('Event updated:', eventId, eventData);
  };

  const handleDeleteEvent = (eventId: string) => {
    // Здесь можно добавить дополнительную логику после удаления события
    console.log('Event deleted:', eventId);
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Необходима авторизация для просмотра календаря</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <CalendarModule
        userId={user?.id}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        onCreateEvent={handleCreateEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        className={styles.calendarModule}
      />
    </div>
  );
};

export default CalendarPage;
