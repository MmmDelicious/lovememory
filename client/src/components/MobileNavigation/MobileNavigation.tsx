import React, { useState } from 'react';
import { Home, Gamepad2, BarChart3, User, Calendar } from 'lucide-react';
import styles from './MobileNavigation.module.css';

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Главная',
      icon: Home
    },
    {
      id: 'calendar',
      label: 'Календарь',
      icon: Calendar
    },
    {
      id: 'games',
      label: 'Игры',
      icon: Gamepad2
    },
    {
      id: 'insights',
      label: 'Аналитика',
      icon: BarChart3
    },
    {
      id: 'profile',
      label: 'Я',
      icon: User
    }
  ];

  return (
    <div className={styles.mobileNav}>
      <div className={styles.navContainer}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              className={`${styles.navTab} ${isActive ? styles.navTabActive : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <div className={styles.navIconContainer}>
                <Icon 
                  size={24} 
                  className={styles.navIcon}
                />
              </div>
              <span className={styles.navLabel}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation;