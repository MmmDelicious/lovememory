import React from 'react';
import { FaChevronLeft, FaChevronRight, FaFilter, FaListUl, FaPlus, FaHeart } from 'react-icons/fa';
import styles from './Calendar.module.css';

interface CalendarHeaderProps {
  currentTitle: string;
  viewMode: string;
  isFiltersOpen: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: string) => void;
  onToggleFilters: () => void;
  onToggleList: () => void;
  onCreateDate: () => void;
  onCreateEvent: () => void;
}

/**
 * Хедер календаря - вынесен из монстра Calendar.tsx
 */
const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentTitle,
  viewMode,
  isFiltersOpen,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
  onToggleFilters,
  onToggleList,
  onCreateDate,
  onCreateEvent
}) => {
  return (
    <div className={styles.calendarControls}>
      <div className={styles.calendarHeader}>
        <h1 className={styles.calendarTitle}>{currentTitle}</h1>
        <div className={styles.navigationControls}>
          <button onClick={onPrevious} className={styles.navButton}>
            <FaChevronLeft />
          </button>
          <button onClick={onNext} className={styles.navButton}>
            <FaChevronRight />
          </button>
        </div>
      </div>

      <div className={styles.viewControls}>
        <div className={styles.viewModeButtons}>
          <button 
            className={`${styles.viewButton} ${viewMode === 'dayGridMonth' ? styles.active : ''}`}
            onClick={() => onViewChange('dayGridMonth')}
          >
            Месяц
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'dayGridWeek' ? styles.active : ''}`}
            onClick={() => onViewChange('dayGridWeek')}
          >
            Неделя
          </button>
          <button 
            className={`${styles.viewButton} ${viewMode === 'listWeek' ? styles.active : ''}`}
            onClick={() => onViewChange('listWeek')}
          >
            День
          </button>
        </div>

        <button onClick={onToday} className={styles.todayButton}>
          Сегодня
        </button>

        <button 
          onClick={onToggleFilters}
          className={`${styles.filterButton} ${isFiltersOpen ? styles.active : ''}`}
        >
          <FaFilter />
        </button>

        <button onClick={onToggleList} className={styles.listButton}>
          <FaListUl />
        </button>

        <button onClick={onCreateDate} className={styles.createDateButton}>
          <FaHeart />
          <span>Свидание</span>
        </button>

        <button onClick={onCreateEvent} className={styles.createButton}>
          <FaPlus />
          <span>Добавить</span>
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;

