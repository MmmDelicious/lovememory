import React from 'react';
import { Link } from 'react-router-dom';
import styles from './GamesPage.module.css';
import { GAMES_CONFIG } from '../../config/games.config';

const GAME_ITEMS = Object.values(GAMES_CONFIG).map(game => ({
  id: game.id,
  name: game.name,
  category: game.category,
  icon: <game.Icon size={48} />,
  path: game.id === 'love-vegas' ? '/love-vegas' : `/games/${game.id}`,
}));

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