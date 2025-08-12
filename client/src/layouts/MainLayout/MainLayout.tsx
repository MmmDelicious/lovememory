import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import MobileLayout from '../../components/MobileLayout/MobileLayout';
import DashboardPage from '../../pages/DashboardPage/DashboardPage';
import MobileDashboard from '../../pages/DashboardPage/MobileDashboard';
import GamesPage from '../../pages/GamesPage/GamesPage';
import MobileGames from '../../pages/GamesPage/MobileGames';
import InsightsPage from '../../pages/InsightsPage/InsightsPage';
import MobileInsights from '../../pages/InsightsPage/MobileInsights';
import ProfilePage from '../../pages/ProfilePage/ProfilePage';
import { 
  Home, 
  Calendar, 
  User, 
  Gamepad2, 
  Settings,
  Heart,
  Coins,
  Bell,
  Menu,
  X,
  BarChart3
} from 'lucide-react';
import styles from './MainLayout.module.css';
// import { useAuth } from '../../context/AuthContext';
// import { useCurrency } from '../../context/CurrencyContext';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  
  // Временно закомментировано до создания контекстов
  // const { user } = useAuth();
  // const { coins } = useCurrency();
  
  // Mock данные для демонстрации
  const user = { first_name: 'Александр', avatar: null };
  const coins = 1250;

  // Check if mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigationItems = [
    {
      path: '/dashboard',
      icon: <Home size={20} />,
      label: 'Главная',
      active: location.pathname === '/dashboard'
    },
    {
      path: '/games',
      icon: <Gamepad2 size={20} />,
      label: 'Игры',
      active: location.pathname.startsWith('/games')
    },
    {
      path: '/insights',
      icon: <BarChart3 size={20} />,
      label: 'Аналитика',
      active: location.pathname === '/insights'
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

  // Mobile Layout
  if (isMobile) {
    const renderMobileContent = () => {
      switch (location.pathname) {
        case '/dashboard':
          return <MobileDashboard />;
        case '/games':
          return <MobileGames />;
        case '/insights':
          return <MobileInsights />;
        case '/profile':
          return <ProfilePage />;
        default:
          if (location.pathname.startsWith('/games/')) {
            return <Outlet />;
          }
          return <MobileDashboard />;
      }
    };

    return (
      <MobileLayout>
        {renderMobileContent()}
      </MobileLayout>
    );
  }

  // Desktop Layout
  return (
    <div className={styles.layout}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Logo */}
          <Link to="/dashboard" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Heart size={24} />
            </div>
            <span className={styles.logoText}>LoveApp</span>
          </Link>

          {/* Desktop Navigation */}
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

          {/* User Section */}
          <div className={styles.userSection}>
            {/* Coins */}
            <div className={styles.coinsDisplay}>
              <Coins size={18} />
              <span>{coins.toLocaleString()}</span>
            </div>

            {/* Notifications */}
            <button className={styles.notificationButton}>
              <Bell size={20} />
              <span className={styles.notificationBadge}>3</span>
            </button>

            {/* User Avatar */}
            <div className={styles.userAvatar}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.first_name} />
              ) : (
                <span>{user.first_name[0].toUpperCase()}</span>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
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

      {/* Main Content */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* Background Elements */}
      <div className={styles.backgroundElements}>
        <div className={styles.floatingHeart} style={{ '--delay': '0s' } as React.CSSProperties}>💕</div>
        <div className={styles.floatingHeart} style={{ '--delay': '3s' } as React.CSSProperties}>💖</div>
        <div className={styles.floatingHeart} style={{ '--delay': '6s' } as React.CSSProperties}>💝</div>
      </div>
    </div>
  );
};

export default MainLayout;