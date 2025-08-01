import React, { useEffect } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import { useEvents } from '../../hooks/useEvents';
import { useAuth } from '../../context/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const { 
    events, 
    isLoading, 
    error,
    createEvent,
    updateEvent,
    deleteEvent
  } = useEvents(user?.id);

  // Обрабатываем ошибки из хука useEvents
  useEffect(() => {
    if (error) {
      handleError(error, 'Ошибка при загрузке календаря');
    }
  }, [error, handleError]);

  if (isLoading) {
    return <div className={styles.container}>Загрузка календаря...</div>;
  }

  return (
    <div className={styles.container}>
      <Calendar 
        events={events}
        userId={user.id}
        onCreateEvent={createEvent}
        onUpdateEvent={updateEvent}
        onDeleteEvent={deleteEvent}
      />
    </div>
  );
};

export default DashboardPage;