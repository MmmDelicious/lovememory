import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../components/Header/Header';
import styles from './MainLayout.module.css';

const MainLayout = () => (
  <div className={styles.layout}>
    <Header />
    <main className={styles.mainContent}>
      <Outlet />
    </main>
  </div>
);

export default MainLayout;