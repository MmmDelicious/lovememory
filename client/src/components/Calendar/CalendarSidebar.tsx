import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus, FaEdit, FaTrash, FaCopy, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import styles from './CalendarSidebar.module.css';
import type { EventTemplateData } from '../EventTemplateModal/EventTemplateModal';
interface CalendarSidebarProps {
  onClose: () => void;
  monthLabel: string;
  goPrev: () => void;
  goNext: () => void;
  miniDays: Date[];
  currentDate: Date;
  gotoDate: (date: Date) => void;
  templateContainerRef: React.RefObject<HTMLDivElement | null>;
  customTemplatesRef: React.RefObject<HTMLDivElement | null>;
  sortedTypeEntries: [string, string][];
  TYPE_LABELS: Record<string, string>;
  filter: string;
  setFilter: (filter: string) => void;
  customTemplates?: EventTemplateData[];
  onCreateTemplate?: () => void;
  onEditTemplate?: (template: EventTemplateData) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onDuplicateTemplate?: (template: EventTemplateData) => void;
}
const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  onClose,
  monthLabel,
  goPrev,
  goNext,
  miniDays,
  currentDate,
  gotoDate,
  templateContainerRef,
  customTemplatesRef,
  sortedTypeEntries,
  TYPE_LABELS,
  filter,
  setFilter,
  customTemplates = [],
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
}) => {
  const [isTemplatesCollapsed, setIsTemplatesCollapsed] = useState(false);
  const [isCustomTemplatesCollapsed, setIsCustomTemplatesCollapsed] = useState(false);
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  return (
    <div className={styles.sidebarContent}>
      {}
      <div className={styles.miniCalendar}>
        <div className={styles.miniHeader}>
          <span className={styles.miniTitle}>{monthLabel}</span>
          <div className={styles.calendarNav}>
            <button className={styles.navArrow} aria-label="Предыдущий" onClick={goPrev}>
              <FaChevronLeft />
            </button>
            <button className={styles.navArrow} aria-label="Следующий" onClick={goNext}>
              <FaChevronRight />
            </button>
          </div>
        </div>
        <div className={styles.miniGrid}>
          <div className={styles.miniWeekdays}>
            {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (<span key={d}>{d}</span>))}
          </div>
          <div className={styles.miniDates}>
            {miniDays.map(d => {
              const isToday = new Date().toDateString() === d.toDateString();
              const isOtherMonth = d.getMonth() !== currentDate.getMonth();
              return (
                <button
                  key={d.toISOString()}
                  className={`${styles.miniDate} ${isOtherMonth ? styles.otherMonth : ''} ${isToday ? styles.today : ''}`}
                  onClick={() => gotoDate(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {}
      <div className={styles.sidebarSection}>
        <div className={styles.sectionHeader}>
          <h3>Шаблоны событий</h3>
          <div className={styles.headerActions}>
            {onCreateTemplate && (
              <button 
                className={styles.createTemplateButton}
                onClick={onCreateTemplate}
                title="Создать шаблон"
              >
                <FaPlus />
              </button>
            )}
            <button
              className={styles.collapseButton}
              onClick={() => setIsTemplatesCollapsed(!isTemplatesCollapsed)}
              title={isTemplatesCollapsed ? "Развернуть" : "Свернуть"}
            >
              {isTemplatesCollapsed ? <FaChevronDown /> : <FaChevronUp />}
            </button>
          </div>
        </div>
        {!isTemplatesCollapsed && (
          <div className={styles.templateList} ref={templateContainerRef}>
            {sortedTypeEntries.map(([type, color]) => (
              <div
                key={type}
                className={`${styles.templateItem} js-template-item`}
                draggable
                data-type={type}
                data-title={TYPE_LABELS[type] || 'Событие'}
                data-color={color}
                data-duration={type === 'date' ? '120' : ''}
                title="Перетащите на календарь"
              >
                <span className={styles.categoryDot} style={{ backgroundColor: color }} />
                <span className={styles.templateName}>{TYPE_LABELS[type] || type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {}
      {customTemplates.length > 0 && (
        <div className={styles.sidebarSection}>
          <div className={styles.sectionHeader}>
            <h3>Мои шаблоны</h3>
            <button
              className={styles.collapseButton}
              onClick={() => setIsCustomTemplatesCollapsed(!isCustomTemplatesCollapsed)}
              title={isCustomTemplatesCollapsed ? "Развернуть" : "Свернуть"}
            >
              {isCustomTemplatesCollapsed ? <FaChevronDown /> : <FaChevronUp />}
            </button>
          </div>
          {!isCustomTemplatesCollapsed && (
            <div className={styles.customTemplatesList} ref={customTemplatesRef}>
              {customTemplates.map((template) => (
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
                    <span className={styles.categoryDot} style={{ backgroundColor: template.color }} />
                    <span className={styles.templateName}>{template.name}</span>
                  </div>
                  <div className={styles.templateActions}>
                    {onEditTemplate && (
                      <button
                        className={styles.templateActionButton}
                        onClick={() => onEditTemplate(template)}
                        title="Редактировать"
                      >
                        <FaEdit />
                      </button>
                    )}
                    {onDuplicateTemplate && (
                      <button
                        className={styles.templateActionButton}
                        onClick={() => onDuplicateTemplate(template)}
                        title="Дублировать"
                      >
                        <FaCopy />
                      </button>
                    )}
                    {onDeleteTemplate && template.id && (
                      <button
                        className={styles.templateActionButton}
                        onClick={() => onDeleteTemplate(template.id!)}
                        title="Удалить"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default CalendarSidebar;

