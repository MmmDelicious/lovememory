import React from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import styles from './CalendarSidebar.module.css';

const CalendarSidebar = ({
  onClose,
  monthLabel,
  goPrev,
  goNext,
  miniDays,
  currentDate,
  gotoDate,
  templateContainerRef,
  sortedTypeEntries,
  TYPE_LABELS,
  filter,
  setFilter,
}) => {
  return (
    <div className={styles.sidebarContent}>
      <div className={styles.miniCalendar}>
        <div className={styles.miniHeader}>
          <span className={styles.miniTitle}>{monthLabel}</span>
          <div className={styles.calendarNav}>
            <button className={styles.navArrow} aria-label="Предыдущий" onClick={goPrev}><FaChevronLeft /></button>
            <button className={styles.navArrow} aria-label="Следующий" onClick={goNext}><FaChevronRight /></button>
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
      <div className={styles.sidebarSection}>
        <div className={styles.sectionHeader}><h3>Шаблоны событий</h3></div>
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
      </div>
      <div className={styles.sidebarSection}>
        <div className={styles.sectionHeader}><h3>Фильтры</h3></div>
        <div className={styles.calendarList}>
          <button
            className={`${styles.calendarItemBtn} ${filter === 'mine' ? styles.active : ''}`}
            onClick={() => setFilter(filter === 'mine' ? 'all' : 'mine')}
          >
            <span className={styles.calendarColor} style={{ backgroundColor: '#D97A6C' }}></span>
            <span className={styles.calendarName}>Мои</span>
          </button>
          <button
            className={`${styles.calendarItemBtn} ${filter === 'shared' ? styles.active : ''}`}
            onClick={() => setFilter(filter === 'shared' ? 'all' : 'shared')}
          >
            <span className={styles.calendarColor} style={{ backgroundColor: '#EADFD8' }}></span>
            <span className={styles.calendarName}>Общие</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarSidebar;