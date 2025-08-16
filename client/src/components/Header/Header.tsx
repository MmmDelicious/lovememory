import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import Button from '../Button/Button';
import UserDropdown from '../UserDropdown/UserDropdown';
import styles from './Header.module.css';
import coinIcon from '../../assets/coin.svg';

interface AuthenticatedNavProps {
  coins: number;
  user: any;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const AuthenticatedNav: React.FC<AuthenticatedNavProps> = ({ coins, user, onLogout, onNavigate }) => (
  <>
    <div className={styles.currencyDisplay}>
      <img src={coinIcon} alt="Coins" className={styles.coinIcon} />
      <span>{coins}</span>
    </div>
    <div className={styles.desktopNav}>
      <Link to="/dashboard" className={styles.navLink}>Календарь</Link>
      <Link to="/profile" className={styles.navLink}>Профиль</Link>
      <Link to="/games" className={styles.navLink}>Игры</Link>
      <Link to="/insights" className={styles.navLink}>Аналитика</Link>
    </div>
    <UserDropdown user={user} onLogout={onLogout} onNavigate={onNavigate} />
  </>
);

const GuestNav: React.FC = () => (
  <>
    <Link to="/login" className={styles.navLink}>Войти</Link>
    <Link to="/register">
      <Button type="primary">Регистрация</Button>
    </Link>
  </>
);

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { coins } = useCurrency();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoWrapper}>
        <Link to="/" className={styles.logo}>
          LoveMemory
        </Link>
      </div>

      <nav className={styles.nav}>
        {user ? (
          <AuthenticatedNav 
            coins={coins} 
            user={user}
            onLogout={logout} 
            onNavigate={handleNavigate}
          />
        ) : (
          <GuestNav />
        )}
      </nav>
    </header>
  );
};

export default Header;
