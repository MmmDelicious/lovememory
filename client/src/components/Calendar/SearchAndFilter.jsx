import React, { useState } from 'react';
import styles from './SearchAndFilter.module.css';

const CalendarFilters = ({ onFilterChange, activeFilter }) => {
  // Компактные фильтры для календаря

  const MAIN_FILTERS = [
    { id: 'all', label: 'Все', icon: '📅' },
    { id: 'mine', label: 'Мои', icon: '👤' },
    { id: 'shared', label: 'Общие', icon: '🤝' },
    { id: 'partner', label: 'Партнёра', icon: '💑' }
  ];

  const ADDITIONAL_FILTERS = [
    { id: 'upcoming', label: 'Предстоящие', icon: '⏰' },
    { id: 'this_week', label: 'На этой неделе', icon: '📆' },
    { id: 'this_month', label: 'В этом месяце', icon: '🗓️' },
    { id: 'birthdays', label: 'Дни рождения', icon: '🎂' },
    { id: 'anniversaries', label: 'Годовщины', icon: '💕' },
    { id: 'memories', label: 'Воспоминания', icon: '💭' },
    { id: 'travel', label: 'Путешествия', icon: '✈️' }
  ];

  // Убрали функцию поиска

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersGrid}>
        {/* Компактные основные фильтры */}
        <div className={styles.compactFiltersRow}>
          {MAIN_FILTERS.map(filter => (
            <button
              key={filter.id}
              className={`${styles.compactFilterButton} ${activeFilter === filter.id ? styles.filterActive : ''}`}
              onClick={() => onFilterChange(filter.id)}
            >
              <span className={styles.filterIcon}>{filter.icon}</span>
              <span className={styles.filterLabel}>{filter.label}</span>
            </button>
          ))}
          
          {/* Дополнительные фильтры в виде селекта */}
          <select 
            className={styles.additionalSelect}
            value={ADDITIONAL_FILTERS.some(f => f.id === activeFilter) ? activeFilter : ''}
            onChange={(e) => e.target.value && onFilterChange(e.target.value)}
          >
            <option value="">Ещё фильтры</option>
            {ADDITIONAL_FILTERS.map(filter => (
              <option key={filter.id} value={filter.id}>
                {filter.icon} {filter.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default CalendarFilters; 