import React from 'react';
import { Link } from 'react-router-dom';
import styles from './GamesPage.module.css';
import { FaChess, FaTicketAlt, FaBrain } from 'react-icons/fa';
import { PiCardsFill } from "react-icons/pi";

const GAME_ITEMS = [
  {
    id: 'tic-tac-toe',
    name: 'Крестики-нолики',
    category: 'Классика',
    icon: <FaTicketAlt size={48} />,
    path: '/games/tic-tac-toe',
  },
  {
    id: 'chess',
    name: 'Шахматы',
    category: 'Стратегия',
    icon: <FaChess size={48} />,
    path: '/games/chess',
  },
  {
    id: 'quiz',
    name: 'Квиз',
    category: 'Викторина',
    icon: <FaBrain size={48} />,
    path: '/games/quiz',
  },
  {
    id: 'love-vegas',
    name: 'LoveVegas',
    category: 'Карточные',
    icon: <PiCardsFill size={48} />,
    path: '/love-vegas',
  }
];

const GamesPage = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Game Room</h1>
        <p className={styles.subtitle}>Play some fun games with your partner.</p>
      </header>
      
      <main className={styles.grid}>
        {GAME_ITEMS.map(item => (
          <Link to={item.path} key={item.id} className={styles.card}>
            <div className={styles.cardIconWrapper}>
              {item.icon}
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{item.name}</h3>
              <p className={styles.cardCategory}>{item.category}</p>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
};

export { GamesPage };