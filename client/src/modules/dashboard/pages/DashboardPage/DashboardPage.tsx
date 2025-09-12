import React, { useState, useEffect } from 'react';
import { useUser } from '@/store';
import styles from './DashboardPage.module.css';
import Calendar from '@/modules/events/components/Calendar/Calendar';
import { useEvents } from '@/modules/events/hooks/useEvents';
import { useEventTemplates } from '@/modules/events/hooks/useEventTemplates';

const DashboardPage: React.FC = () => {
  const user = useUser();
  const [isLoading, setIsLoading] = useState(true);
  
  const { events, isLoading: areEventsLoading, createEvent, updateEvent, deleteEvent } = useEvents(user?.id);
  const { templates, isLoading: areTemplatesLoading, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useEventTemplates(user?.id);

  useEffect(() => {
    if (!areEventsLoading && !areTemplatesLoading) {
      setIsLoading(false);
    }
  }, [areEventsLoading, areTemplatesLoading]);

  if (isLoading || areEventsLoading || areTemplatesLoading) {
    return <div className={styles.loader}>Загрузка календаря...</div>;
  }

  if (!user) {
    return <div className={styles.loader}>Пользователь не найден...</div>;
  }


  return (
    <>
      <Calendar
        events={events || []}
        userId={user?.id || ''}
        onCreateEvent={createEvent}
        onUpdateEvent={updateEvent}
        onDeleteEvent={deleteEvent}
        customTemplates={templates || []}
        onCreateTemplate={createTemplate}
        onEditTemplate={updateTemplate}
        onDeleteTemplate={deleteTemplate}
        onDuplicateTemplate={duplicateTemplate}
      />
    </>
  );
};

export default DashboardPage;
