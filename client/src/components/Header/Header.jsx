import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import styles from './Header.module.css';
import Button from '../Button/Button';
import coinIcon from '../../assets/coin.svg';

const Header = () => {
  const { user, logout } = useAuth();
  const { coins } = useCurrency();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };
  
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo} onClick={closeMenu}>
        LoveMemory
      </Link>

      <div className={styles.burger} onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <div className={isMenuOpen ? `${styles.line} ${styles.line1Open}` : styles.line}></div>
        <div className={isMenuOpen ? `${styles.line} ${styles.line2Open}` : styles.line}></div>
        <div className={isMenuOpen ? `${styles.line} ${styles.line3Open}` : styles.line}></div>
      </div>

      <nav className={isMenuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav}>
        {user ? (
          <>
            <div className={styles.currencyDisplay}>
              <img src={coinIcon} alt="Coins" className={styles.coinIcon} />
              <span>{coins}</span>
            </div>
            <Link to="/dashboard" className={styles.navLink} onClick={closeMenu}>Календарь</Link>
            <Link to="/pairing" className={styles.navLink} onClick={closeMenu}>Пара</Link>
            <Link to="/games" className={styles.navLink} onClick={closeMenu}>Игры</Link>
            <Button onClick={handleLogout} type="secondary">Выйти</Button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.navLink} onClick={closeMenu}>Войти</Link>
            <Link to="/register" onClick={closeMenu}>
              <Button type="primary">Регистрация</Button>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;