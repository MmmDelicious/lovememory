import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  Home,
  User,
  Gamepad2,
  Settings,
  Heart,
  Coins,
  Bell,
  Menu,
  X,
  BarChart3,
} from 'lucide-react';
import styles from './MainLayout.module.css';
import { useAuth } from '../../context/AuthContext';

const MainLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user } = useAuth();
  const coins = user?.coins ?? 0;

  const navigationItems = [
    {
      path: '/dashboard',
      icon: <Home size={20} />,
      label: 'Главная',
      active: location.pathname === '/dashboard',
    },
    {
      path: '/games',
      icon: <Gamepad2 size={20} />,
      label: 'Игры',
      active: location.pathname.startsWith('/games'),
    },
    {
      path: '/insights',
      icon: <BarChart3 size={20} />,
      label: 'Аналитика',
      active: location.pathname === '/insights',
    },
    {
      path: '/profile',
      icon: <User size={20} />,
      label: 'Профиль',
      active: location.pathname === '/profile',
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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

            {/* User Avatar */}
            <Link to="/profile" className={styles.userAvatar} title="Профиль">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user?.first_name || 'User'} />
              ) : (
                <span>{(user?.first_name || 'U').slice(0, 1).toUpperCase()}</span>
              )}
            </Link>

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
        <div className={styles.floatingHeart} style={{ '--delay': '0s' }}>
          💕
        </div>
        <div className={styles.floatingHeart} style={{ '--delay': '3s' }}>
          💖
        </div>
        <div className={styles.floatingHeart} style={{ '--delay': '6s' }}>
          💝
        </div>
      </div>
    </div>
  );
};

export default MainLayout;