import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './GameLayout.module.css';
const GameLayout = () => (
  <div className={styles.layout}>
    <main className={styles.mainContent}>
      <Outlet />
    </main>
  </div>
);
export default GameLayout; 
