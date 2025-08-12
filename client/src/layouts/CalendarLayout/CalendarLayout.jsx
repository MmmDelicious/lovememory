import React from 'react';
import styles from './CalendarLayout.module.css';

const CalendarLayout = ({ sidebar, children }) => {
  return (
    <div className={styles.plannerLayout}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
};

export default CalendarLayout;