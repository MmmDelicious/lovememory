import React from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import MobileLayout from '../../layouts/MobileLayout/MobileLayout';
import DashboardPage from '../../pages/DashboardPage/DashboardPage';
import MobileDashboard from '../../pages/MobileDashboard/MobileDashboard';
import GamesPage from '../../pages/GamesPage/GamesPage';
import MobileGames from '../../pages/GamesPage/MobileGames';
import InsightsPage from '../../pages/InsightsPage/InsightsPage';
import MobileInsights from '../../pages/InsightsPage/MobileInsights';
import ProfilePage from '../../pages/ProfilePage/ProfilePage';
import NotificationDropdown from '../../components/NotificationDropdown/NotificationDropdown';
import UserDropdown from '../../components/UserDropdown/UserDropdown';
import GiftDisplay from '../../components/GiftDisplay/GiftDisplay';
import { useGifts } from '../../hooks/useGifts';
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
  BarChart3,
  Gift,
  BookOpen,
  Trophy
} from 'lucide-react';
import styles from './MainLayout.module.css';
import { useUser, useCoins, useAuthActions, useCurrencyActions } from '../../store/hooks';
const MainLayout: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const user = useUser();
  const coins = useCoins();
  const { receivedGift, isGiftVisible, closeGift } = useGifts();
  const { logout: logoutUser } = useAuthActions();
  const { resetCurrency } = useCurrencyActions();
  const navigate = useNavigate();
  
  const handleLogout = () => {
            logoutUser();
        resetCurrency();
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
      path: '/lessons',
      icon: <BookOpen size={20} />,
      label: 'Уроки',
      active: location.pathname.startsWith('/lessons')
    },
    {
      path: '/shop',
      icon: <Gift size={20} />,
      label: 'Магазин',
      active: location.pathname === '/shop'
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
  if (isMobile) {
    const renderMobileContent = () => {
      switch (location.pathname) {
        case '/dashboard':
          return <MobileDashboard />;
        case '/games':
          return <MobileGames />;

        case '/shop':
          return <Outlet />;
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
                <Coins size={18} />
                <span>{coins.toLocaleString()}</span>
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
      <div className={styles.backgroundElements}>
        <div className={styles.floatingHeart} style={{ '--delay': '0s' } as React.CSSProperties}>💕</div>
        <div className={styles.floatingHeart} style={{ '--delay': '3s' } as React.CSSProperties}>💖</div>
        <div className={styles.floatingHeart} style={{ '--delay': '6s' } as React.CSSProperties}>💝</div>
      </div>
      {}
      {isGiftVisible && receivedGift && (
        <GiftDisplay gift={receivedGift} onClose={closeGift} />
      )}
    </div>
  );
};
export default MainLayout;
