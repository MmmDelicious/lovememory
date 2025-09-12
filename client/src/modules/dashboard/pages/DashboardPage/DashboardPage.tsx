import React from 'react';
import { useUser } from '@/store';
import styles from './DashboardPage.module.css';
import { CalendarModule } from '@/modules/events/modules';

const DashboardPage: React.FC = () => {
  const user = useUser();

  if (!user) {
    return <div className={styles.loader}>Пользователь не найден...</div>;
  }

  const handleEventClick = (eventId: string, date: string) => {
    // Навигация через window.location для простоты
    window.location.href = `/day/${date}`;
  };

  const handleDateClick = (date: string) => {
    window.location.href = `/day/${date}`;
  };

  return (
    <div className={styles.container}>
      <CalendarModule
        userId={user?.id}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
      />
    </div>
  );
};

export default DashboardPage;
