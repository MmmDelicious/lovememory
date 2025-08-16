import React, { ReactNode } from 'react';
import styles from './CalendarLayout.module.css';

interface CalendarLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

const CalendarLayout: React.FC<CalendarLayoutProps> = ({ sidebar, children }) => {
  return (
    <div className={styles.plannerLayout}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
};

export default CalendarLayout;
