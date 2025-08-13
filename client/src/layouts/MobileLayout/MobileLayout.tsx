import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MobileNavigation from '../../components/MobileNavigation/MobileNavigation';
import styles from './MobileLayout.module.css';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') {
      setActiveTab('dashboard');
    } else if (path === '/dashboard' && path.includes('calendar')) {
      setActiveTab('calendar');
    } else if (path.startsWith('/games')) {
      setActiveTab('games');
    } else if (path.startsWith('/insights')) {
      setActiveTab('insights');
    } else if (path.startsWith('/profile')) {
      setActiveTab('profile');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Navigate to the appropriate route
    switch (tab) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'calendar':
        navigate('/dashboard'); // Пока используем тот же роут, но с календарем
        break;
      case 'games':
        navigate('/games');
        break;
      case 'insights':
        navigate('/insights');
        break;
      case 'profile':
        navigate('/profile');
        break;
    }
  };

  return (
    <div className={styles.mobileLayout}>
      <main className={styles.mobileContent}>
        {children}
      </main>
      <MobileNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
    </div>
  );
};

export default MobileLayout;