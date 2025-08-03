import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import Button from '../Button/Button';
import styles from './Header.module.css';
import coinIcon from '../../assets/coin.svg';

const Burger = ({ isOpen, onClick }) => (
  <div className={styles.burger} onClick={onClick}>
    <div className={isOpen ? `${styles.line} ${styles.line1Open}` : styles.line}></div>
    <div className={isOpen ? `${styles.line} ${styles.line2Open}` : styles.line}></div>
    <div className={isOpen ? `${styles.line} ${styles.line3Open}` : styles.line}></div>
  </div>
);

const AuthenticatedNav = ({ coins, onLogout, onLinkClick }) => (
  <>
    <div className={styles.currencyDisplay}>
      <img src={coinIcon} alt="Coins" className={styles.coinIcon} />
      <span>{coins}</span>
    </div>
    <Link to="/dashboard" className={styles.navLink} onClick={onLinkClick}>Календарь</Link>
    <Link to="/pairing" className={styles.navLink} onClick={onLinkClick}>Пара</Link>
    <Link to="/games" className={styles.navLink} onClick={onLinkClick}>Игры</Link>
    <Button onClick={onLogout} type="secondary">Выйти</Button>
  </>
);

const GuestNav = ({ onLinkClick }) => (
  <>
    <Link to="/login" className={styles.navLink} onClick={onLinkClick}>Войти</Link>
    <Link to="/register" onClick={onLinkClick}>
      <Button type="primary">Регистрация</Button>
    </Link>
  </>
);

const Header = () => {
  const { user, logout } = useAuth();
  const { coins } = useCurrency();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleLinkClick();
  };

  const navClasses = isMenuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav;

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo} onClick={handleLinkClick}>
        LoveMemory
      </Link>

      <Burger isOpen={isMenuOpen} onClick={() => setIsMenuOpen(!isMenuOpen)} />

      <nav className={navClasses}>
        {user ? (
          <AuthenticatedNav coins={coins} onLogout={handleLogout} onLinkClick={handleLinkClick} />
        ) : (
          <GuestNav onLinkClick={handleLinkClick} />
        )}
      </nav>
    </header>
  );
};

export default Header;