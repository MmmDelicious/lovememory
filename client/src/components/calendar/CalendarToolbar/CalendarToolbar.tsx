import React from 'react';
import { FaChevronLeft, FaChevronRight, FaFilter, FaListUl, FaPlus, FaHeart } from 'react-icons/fa';
import { ActionButton } from '../../../ui/calendar';
import styles from './CalendarToolbar.module.css';

interface CalendarToolbarProps {
  title: string;
  currentView: string;
  showFilters?: boolean;
  showList?: boolean;
  onPrevClick: () => void;
  onNextClick: () => void;
  onTodayClick: () => void;
  onViewChange: (view: string) => void;
  onFiltersToggle: () => void;
  onListToggle: () => void;
  onAddEvent?: () => void;
  onGenerateDate?: () => void;
  className?: string;
}

const VIEW_OPTIONS = [
  { value: 'dayGridMonth', label: 'Месяц' },
  { value: 'dayGridWeek', label: 'Неделя' },
  { value: 'dayGridDay', label: 'День' }
];

/**
 * Компонент панели инструментов календаря
 * Содержит простую логику управления видами календаря и действиями
 * Использует UI компоненты ActionButton
 */
export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  title,
  currentView,
  showFilters = false,
  showList = false,
  onPrevClick,
  onNextClick,
  onTodayClick,
  onViewChange,
  onFiltersToggle,
  onListToggle,
  onAddEvent,
  onGenerateDate,
  className
}) => {
  return (
    <div className={`${styles.calendarToolbar} ${className || ''}`}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.navigation}>
          <button 
            className={styles.navButton} 
            onClick={onPrevClick}
            aria-label="Предыдущий период"
          >
            <FaChevronLeft />
          </button>
          <button 
            className={styles.navButton} 
            onClick={onNextClick}
            aria-label="Следующий период"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.viewSwitch}>
          {VIEW_OPTIONS.map(option => (
            <button
              key={option.value}
              className={`
                ${styles.viewButton} 
                ${currentView === option.value ? styles.active : ''}
              `}
              onClick={() => onViewChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <ActionButton
          variant="outline"
          onClick={onTodayClick}
        >
          Сегодня
        </ActionButton>

        <div className={styles.toggleButtons}>
          <ActionButton
            icon={FaFilter}
            variant={showFilters ? 'primary' : 'ghost'}
            size="medium"
            onClick={onFiltersToggle}
            title="Фильтры"
          >
          </ActionButton>

          <ActionButton
            icon={FaListUl}
            variant={showList ? 'primary' : 'ghost'}
            size="medium"
            onClick={onListToggle}
            title="Список"
          >
          </ActionButton>
        </div>

        {onGenerateDate && (
          <ActionButton
            icon={FaHeart}
            variant="secondary"
            onClick={onGenerateDate}
          >
            Свидание
          </ActionButton>
        )}

        {onAddEvent && (
          <ActionButton
            icon={FaPlus}
            variant="primary"
            onClick={onAddEvent}
          >
            Добавить
          </ActionButton>
        )}
      </div>
    </div>
  );
};
