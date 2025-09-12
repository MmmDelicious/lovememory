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
  const [activeTab, setActiveTab] = useState('calendar');
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/' || path.startsWith('/calendar')) {
      setActiveTab('calendar');
    } else if (path.startsWith('/lessons')) {
      setActiveTab('lessons');
    } else if (path.startsWith('/profile')) {
      setActiveTab('profile');
    } else {
      setActiveTab('calendar');
    }
  }, [location.pathname]);
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'calendar':
        navigate('/calendar');
        break;
      case 'lessons':
        navigate('/lessons');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        navigate('/calendar');
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
