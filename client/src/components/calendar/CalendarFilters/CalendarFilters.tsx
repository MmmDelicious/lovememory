import React from 'react';
import { FilterButton } from '../../../ui/calendar';
import { FaCalendarAlt, FaUsers, FaHeart, FaBirthdayCake, FaGift, FaPlane, FaCalendarCheck } from 'react-icons/fa';
import styles from './CalendarFilters.module.css';

interface FilterConfig {
  id: string;
  label: string;
  icon?: React.ComponentType;
  color?: string;
  count?: number;
}

interface CalendarFiltersProps {
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  eventCounts?: Record<string, number>;
  className?: string;
}

const FILTER_CONFIGS: FilterConfig[] = [
  { id: 'all', label: 'Все события', icon: FaCalendarAlt },
  { id: 'mine', label: 'Мои', icon: FaCalendarCheck },
  { id: 'shared', label: 'Общие', icon: FaUsers },
  { id: 'upcoming', label: 'Предстоящие', icon: FaCalendarAlt },
  { id: 'memories', label: 'Воспоминания', icon: FaHeart, color: '#e91e63' },
  { id: 'birthdays', label: 'Дни рождения', icon: FaBirthdayCake, color: '#f5a623' },
  { id: 'anniversaries', label: 'Годовщины', icon: FaHeart, color: '#e91e63' },
  { id: 'travel', label: 'Путешествия', icon: FaPlane, color: '#7ed321' },
  { id: 'gifts', label: 'Подарки', icon: FaGift, color: '#9013fe' },
];

/**
 * Компонент фильтров календаря
 * Содержит простую логику управления фильтрами
 * Использует UI компоненты FilterButton
 */
export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  activeFilter,
  onFilterChange,
  eventCounts = {},
  className
}) => {
  return (
    <div className={`${styles.calendarFilters} ${className || ''}`}>
      <div className={styles.mainFilters}>
        {FILTER_CONFIGS.slice(0, 4).map(filter => (
          <FilterButton
            key={filter.id}
            label={filter.label}
            icon={filter.icon}
            isActive={activeFilter === filter.id}
            count={eventCounts[filter.id]}
            onClick={() => onFilterChange(filter.id)}
          />
        ))}
      </div>
      
      <div className={styles.separator} />
      
      <div className={styles.typeFilters}>
        <h4 className={styles.sectionTitle}>По типу событий</h4>
        <div className={styles.filterGrid}>
          {FILTER_CONFIGS.slice(4).map(filter => (
            <FilterButton
              key={filter.id}
              label={filter.label}
              icon={filter.icon}
              color={filter.color}
              isActive={activeFilter === filter.id}
              count={eventCounts[filter.id]}
              size="small"
              onClick={() => onFilterChange(filter.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
