import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaPlus, FaEdit, FaTrash, FaCopy } from 'react-icons/fa';
import { ActionButton } from '../../../ui/calendar';
import styles from './EventTemplatesList.module.css';

interface EventTemplate {
  id: string;
  name: string;
  event_type: string;
  color: string;
  default_title?: string;
  default_description?: string;
  duration_minutes?: number;
  is_all_day?: boolean;
  is_shared?: boolean;
}

interface TemplateItemConfig {
  type: string;
  label: string;
  color: string;
}

interface EventTemplatesListProps {
  templates?: EventTemplate[];
  defaultTemplates?: TemplateItemConfig[];
  onCreateTemplate?: () => void;
  onEditTemplate?: (template: EventTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onDuplicateTemplate?: (template: EventTemplate) => void;
  className?: string;
  templateContainerRef?: React.RefObject<HTMLDivElement>;
  customTemplatesRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Компонент списка шаблонов событий
 * Содержит простую логику управления отображением и взаимодействием с шаблонами
 * Использует UI компоненты ActionButton
 */
export const EventTemplatesList: React.FC<EventTemplatesListProps> = ({
  templates = [],
  defaultTemplates = [],
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  className,
  templateContainerRef,
  customTemplatesRef
}) => {
  const [isDefaultCollapsed, setIsDefaultCollapsed] = useState(false);
  const [isCustomCollapsed, setIsCustomCollapsed] = useState(false);

  return (
    <div className={`${styles.eventTemplatesList} ${className || ''}`}>
      {/* Стандартные шаблоны */}
      {defaultTemplates.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Шаблоны событий</h3>
            <button
              className={styles.collapseButton}
              onClick={() => setIsDefaultCollapsed(!isDefaultCollapsed)}
              title={isDefaultCollapsed ? "Развернуть" : "Свернуть"}
            >
              {isDefaultCollapsed ? <FaChevronDown /> : <FaChevronUp />}
            </button>
          </div>
          
          {!isDefaultCollapsed && (
            <div className={styles.templateList} ref={templateContainerRef}>
              {defaultTemplates.map(template => (
                <div
                  key={template.type}
                  className={`${styles.templateItem} js-template-item`}
                  draggable
                  data-type={template.type}
                  data-title={template.label}
                  data-color={template.color}
                  title="Перетащите на календарь"
                >
                  <span 
                    className={styles.colorDot} 
                    style={{ backgroundColor: template.color }} 
                  />
                  <span className={styles.templateName}>{template.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Пользовательские шаблоны */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Мои шаблоны</h3>
          <div className={styles.headerActions}>
            {onCreateTemplate && (
              <ActionButton
                icon={FaPlus}
                size="small"
                variant="ghost"
                onClick={onCreateTemplate}
                title="Создать шаблон"
              >
              </ActionButton>
            )}
            <button
              className={styles.collapseButton}
              onClick={() => setIsCustomCollapsed(!isCustomCollapsed)}
              title={isCustomCollapsed ? "Развернуть" : "Свернуть"}
            >
              {isCustomCollapsed ? <FaChevronDown /> : <FaChevronUp />}
            </button>
          </div>
        </div>
        
        {!isCustomCollapsed && (
          <div className={styles.customTemplatesList} ref={customTemplatesRef}>
            {templates.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Нет созданных шаблонов</p>
                {onCreateTemplate && (
                  <ActionButton
                    icon={FaPlus}
                    size="small"
                    variant="outline"
                    onClick={onCreateTemplate}
                  >
                    Создать первый шаблон
                  </ActionButton>
                )}
              </div>
            ) : (
              templates.map(template => (
                <div key={template.id} className={styles.customTemplateItem}>
                  <div
                    className={`${styles.templateItem} js-template-item`}
                    draggable
                    data-type={template.event_type}
                    data-title={template.default_title || template.name}
                    data-color={template.color}
                    data-duration={template.duration_minutes || 60}
                    data-description={template.default_description || ''}
                    data-is-all-day={template.is_all_day}
                    data-is-shared={template.is_shared}
                    data-template-id={template.id}
                    title="Перетащите на календарь"
                  >
                    <span 
                      className={styles.colorDot} 
                      style={{ backgroundColor: template.color }} 
                    />
                    <span className={styles.templateName}>{template.name}</span>
                  </div>
                  
                  <div className={styles.templateActions}>
                    {onEditTemplate && (
                      <button
                        className={styles.actionButton}
                        onClick={() => onEditTemplate(template)}
                        title="Редактировать"
                      >
                        <FaEdit />
                      </button>
                    )}
                    {onDuplicateTemplate && (
                      <button
                        className={styles.actionButton}
                        onClick={() => onDuplicateTemplate(template)}
                        title="Дублировать"
                      >
                        <FaCopy />
                      </button>
                    )}
                    {onDeleteTemplate && (
                      <button
                        className={styles.actionButton}
                        onClick={() => onDeleteTemplate(template.id)}
                        title="Удалить"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
