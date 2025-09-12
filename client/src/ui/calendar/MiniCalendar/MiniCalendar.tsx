import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './MiniCalendar.module.css';

export interface MiniCalendarProps {
  monthLabel: string;
  days: Date[];
  currentDate: Date;
  onPrevClick: () => void;
  onNextClick: () => void;
  onDateClick: (date: Date) => void;
  selectedDate?: Date;
  className?: string;
}

/**
 * Базовый UI компонент мини-календаря
 * Не содержит бизнес-логики, только представление
 */
export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  monthLabel,
  days,
  currentDate,
  onPrevClick,
  onNextClick,
  onDateClick,
  selectedDate,
  className
}) => {
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  return (
    <div className={`${styles.miniCalendar} ${className || ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>{monthLabel}</span>
        <div className={styles.nav}>
          <button 
            className={styles.navButton} 
            onClick={onPrevClick}
            aria-label="Предыдущий месяц"
          >
            <FaChevronLeft />
          </button>
          <button 
            className={styles.navButton} 
            onClick={onNextClick}
            aria-label="Следующий месяц"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
      
      <div className={styles.grid}>
        <div className={styles.weekdays}>
          {weekdays.map(day => (
            <span key={day} className={styles.weekday}>
              {day}
            </span>
          ))}
        </div>
        
        <div className={styles.dates}>
          {days.map(date => {
            const isToday = new Date().toDateString() === date.toDateString();
            const isOtherMonth = date.getMonth() !== currentDate.getMonth();
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            
            return (
              <button
                key={date.toISOString()}
                className={`
                  ${styles.dateButton}
                  ${isOtherMonth ? styles.otherMonth : ''}
                  ${isToday ? styles.today : ''}
                  ${isSelected ? styles.selected : ''}
                `}
                onClick={() => onDateClick(date)}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
