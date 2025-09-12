import React from 'react';
import styles from './DateCell.module.css';

export interface DateCellProps {
  date: Date;
  isToday?: boolean;
  isSelected?: boolean;
  isOtherMonth?: boolean;
  hasEvents?: boolean;
  eventCount?: number;
  isWeekend?: boolean;
  isDisabled?: boolean;
  className?: string;
  onClick?: (date: Date) => void;
  onDoubleClick?: (date: Date) => void;
  children?: React.ReactNode;
}

/**
 * Базовый UI компонент ячейки даты в календаре
 * Не содержит бизнес-логики, только представление
 */
export const DateCell: React.FC<DateCellProps> = ({
  date,
  isToday = false,
  isSelected = false,
  isOtherMonth = false,
  hasEvents = false,
  eventCount = 0,
  isWeekend = false,
  isDisabled = false,
  className,
  onClick,
  onDoubleClick,
  children
}) => {
  const cellClass = `
    ${styles.dateCell}
    ${isToday ? styles.today : ''}
    ${isSelected ? styles.selected : ''}
    ${isOtherMonth ? styles.otherMonth : ''}
    ${hasEvents ? styles.hasEvents : ''}
    ${isWeekend ? styles.weekend : ''}
    ${isDisabled ? styles.disabled : ''}
    ${onClick ? styles.clickable : ''}
    ${className || ''}
  `.trim().replace(/\s+/g, ' ');

  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick(date);
    }
  };

  const handleDoubleClick = () => {
    if (!isDisabled && onDoubleClick) {
      onDoubleClick(date);
    }
  };

  return (
    <div
      className={cellClass}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !isDisabled ? 0 : undefined}
      aria-label={`${date.getDate()} ${date.toLocaleDateString('ru-RU', { month: 'long' })}`}
    >
      <div className={styles.dateNumber}>
        {date.getDate()}
        {eventCount > 0 && (
          <span className={styles.eventIndicator}>
            {eventCount > 9 ? '9+' : eventCount}
          </span>
        )}
      </div>
      
      {hasEvents && !eventCount && (
        <div className={styles.eventDot} />
      )}
      
      {children && (
        <div className={styles.content}>
          {children}
        </div>
      )}
    </div>
  );
};
