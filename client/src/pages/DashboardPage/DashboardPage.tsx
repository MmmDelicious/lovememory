import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../hooks/useEvents';
import { useEventTemplates } from '../../hooks/useEventTemplates';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import Calendar from '../../components/Calendar/Calendar';
import EventTemplateModal, { EventTemplateData } from '../../components/EventTemplateModal/EventTemplateModal';
import styles from './DashboardPage.module.css';
const DashboardPage: React.FC = () => {
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
  const {
    templates,
    isLoading: templatesLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
    duplicateTemplate
  } = useEventTemplates(user?.id);
  const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EventTemplateData | null>(null);
  useEffect(() => {
    if (error) {
      handleError(error, 'Ошибка при загрузке календаря');
    }
  }, [error, handleError]);
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateModalOpen(true);
  };
  const handleEditTemplate = (template: EventTemplateData) => {
    setEditingTemplate(template);
    setTemplateModalOpen(true);
  };
  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Удалить этот шаблон?')) {
      await deleteTemplate(templateId);
    }
  };
  const handleDuplicateTemplate = async (template: EventTemplateData) => {
    await duplicateTemplate(template.id!);
  };
  const handleSaveTemplate = async (templateData: EventTemplateData) => {
    try {
      if (editingTemplate?.id) {
        await updateTemplate(editingTemplate.id, templateData);
      } else {
        await createTemplate(templateData);
      }
    } catch (error) {
      console.error('Ошибка при сохранении шаблона:', error);
      throw error;
    }
  };
  if (isLoading) {
    return <div className={styles.loader}>Загрузка календаря...</div>;
  }
  return (
    <>
      <Calendar
        events={events}
        userId={user?.id || ''}
        onCreateEvent={createEvent}
        onUpdateEvent={updateEvent}
        onDeleteEvent={deleteEvent}
        customTemplates={templates}
        onCreateTemplate={handleCreateTemplate}
        onEditTemplate={handleEditTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onDuplicateTemplate={handleDuplicateTemplate}
      />
      <EventTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSave={handleSaveTemplate}
        editingTemplate={editingTemplate}
      />
    </>
  );
};
export default DashboardPage;
