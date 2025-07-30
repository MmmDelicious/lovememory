import React from 'react';
import Calendar from '../../components/Calendar/Calendar';
import { useEvents } from '../../hooks/useEvents';
import { useAuth } from '../../context/AuthContext';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const { 
    events, 
    isLoading, 
    error,
    createEvent,
    updateEvent,
    deleteEvent
  } = useEvents(user?.id);

  if (isLoading) {
    return <div className={styles.container}>Загрузка календаря...</div>;
  }

  if (error) {
    return <div className={styles.container}>Ошибка при загрузке данных.</div>;
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