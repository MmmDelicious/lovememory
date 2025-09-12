import React from 'react';
import styles from './GamesHero.module.css';

const GamesHero: React.FC = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.backgroundElements}>
        <div className={styles.floatingShape} style={{ '--delay': '0s' } as React.CSSProperties}></div>
        <div className={styles.floatingShape} style={{ '--delay': '3s' } as React.CSSProperties}></div>
        <div className={styles.floatingShape} style={{ '--delay': '6s' } as React.CSSProperties}></div>
      </div>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>Игровая комната</h1>
        <p className={styles.heroSubtitle}>Выбирайте и играйте вдвоём</p>
      </div>
    </section>
  );
};

export default GamesHero;
