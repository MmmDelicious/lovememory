import React from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import MobileLayout from '../MobileLayout/MobileLayout';
import NotificationDropdown from '../../components/NotificationDropdown/NotificationDropdown';
import UserDropdown from '../../components/UserDropdown/UserDropdown';
import { 
  Home, 
  Calendar, 
  User, 
  Gamepad2, 
  Settings,
  Heart,
  Bell,
  Menu,
  X,
  BarChart3,
  Gift,
  BookOpen,
  Trophy
} from 'lucide-react';
import styles from './MainLayout.module.css';
import { useUser, useAuthActions } from '../../../store/hooks';
const MainLayout: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const user = useUser();
  const { logout: logoutUser } = useAuthActions();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };
  
  const handleNavigate = (path: string) => {
    navigate(path);
  };
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const navigationItems = [
    // ИГРЫ ВРЕМЕННО ОТКЛЮЧЕНЫ
    // {
    //   path: '/games',
    //   icon: <Gamepad2 size={20} />,
    //   label: 'Игры',
    //   active: location.pathname.startsWith('/games')
    // },
    {
      path: '/calendar',
      icon: <Calendar size={20} />,
      label: 'Календарь',
      active: location.pathname === '/calendar' || location.pathname === '/dashboard'
    },
    {
      path: '/lessons',
      icon: <BookOpen size={20} />,
      label: 'Уроки',
      active: location.pathname.startsWith('/lessons')
    },
    {
      path: '/profile',
      icon: <User size={20} />,
      label: 'Профиль',
      active: location.pathname === '/profile'
    }
  ];
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  if (isMobile) {
    return (
      <MobileLayout>
        <Outlet />
      </MobileLayout>
    );
  }
  return (
    <div className={styles.layout}>
      {}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {}
          <Link to="/dashboard" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Heart size={24} />
            </div>
            <span className={styles.logoText}>LoveApp</span>
          </Link>
          {}
          <nav className={styles.desktopNav}>
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${item.active ? styles.navItemActive : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          {}
          {user ? (
            <div className={styles.userSection}>
              {}
              <div className={styles.coinsDisplay}>
                <span className="text-sm font-medium text-gray-700">Монеты: {user?.coins || 1000}</span>
              </div>
              {}
              <NotificationDropdown />
              {}
              <UserDropdown user={user} onLogout={handleLogout} onNavigate={handleNavigate} />
              {}
              <button 
                className={styles.mobileMenuButton}
                onClick={toggleMobileMenu}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          ) : (
            <div className={styles.authSection}>
              <Link to="/login" className={styles.loginButton}>
                Войти
              </Link>
            </div>
          )}
        </div>
        {}
        <nav className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.mobileNavOpen : ''}`}>
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.mobileNavItem} ${item.active ? styles.mobileNavItemActive : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <div className={styles.mobileNavDivider}></div>
          <Link
            to="/settings"
            className={styles.mobileNavItem}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Settings size={20} />
            <span>Настройки</span>
          </Link>
        </nav>
      </header>
      {}
      <main className={styles.main}>
        <Outlet />
      </main>
      {}
    </div>
  );
};
export default MainLayout;
