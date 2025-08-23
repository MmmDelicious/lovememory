import React, { useState, useEffect } from 'react';
import { useUser } from '../../store/hooks';
import styles from './DashboardPage.module.css';
import Calendar from '../../components/Calendar/Calendar';
import { useEvents } from '../../hooks/useEvents';
import { useEventTemplates } from '../../hooks/useEventTemplates';

const DashboardPage: React.FC = () => {
  const user = useUser();
  const [isLoading, setIsLoading] = useState(true);
  
  // Восстанавливаем загрузку событий и шаблонов
  const { events, isLoading: areEventsLoading, createEvent, updateEvent, deleteEvent } = useEvents(user?.id);
  const { templates, isLoading: areTemplatesLoading, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useEventTemplates(user?.id);

  console.log('🔍 DashboardPage: user из Redux:', user);
  console.log('📅 DashboardPage: события:', events);
  console.log('📋 DashboardPage: шаблоны:', templates);

  useEffect(() => {
    // Ждем загрузки событий и шаблонов
    if (!areEventsLoading && !areTemplatesLoading) {
      setIsLoading(false);
    }
  }, [areEventsLoading, areTemplatesLoading]);

  if (isLoading || areEventsLoading || areTemplatesLoading) {
    return <div className={styles.loader}>Загрузка календаря...</div>;
  }

  if (!user) {
    console.log('❌ DashboardPage: пользователь не найден!');
    return <div className={styles.loader}>Пользователь не найден...</div>;
  }

  console.log('✅ DashboardPage: отображаем календарь для пользователя:', user.id);

  // Создаем обертки для совместимости с Calendar
  const handleCreateTemplate = () => {
    // TODO: Открыть модальное окно создания шаблона
    console.log('Создание шаблона');
  };

  const handleEditTemplate = (template: any) => {
    // TODO: Открыть модальное окно редактирования шаблона
    console.log('Редактирование шаблона:', template);
  };

  const handleDeleteTemplate = (template: any) => {
    // TODO: Удалить шаблон
    console.log('Удаление шаблона:', template);
  };

  const handleDuplicateTemplate = (template: any) => {
    // TODO: Дублировать шаблон
    console.log('Дублирование шаблона:', template);
  };

  return (
    <>
      <Calendar
        events={events || []}
        userId={user?.id || ''}
        onCreateEvent={createEvent}
        onUpdateEvent={updateEvent}
        onDeleteEvent={deleteEvent}
        customTemplates={templates || []}
        onCreateTemplate={handleCreateTemplate}
        onEditTemplate={handleEditTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onDuplicateTemplate={handleDuplicateTemplate}
      />
    </>
  );
};

export default DashboardPage;
