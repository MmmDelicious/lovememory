import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';
import styles from './GamesPage.module.css';
import { GAMES_CONFIG } from '../../config/games.config';

const GAME_ITEMS = Object.values(GAMES_CONFIG).map(game => ({
  id: game.id,
  name: game.name,
  category: game.category,
  description: game.description || 'Играйте вместе с партнером',
  icon: <game.Icon size={48} />,
  path: `/games/${game.id}`,
  gradient: game.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  image: game.image || `https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop`
}));

const GamesPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.backgroundPattern}></div>
      </div>
      
      <header className={styles.header}>
        <div className={styles.mascotContainer}>
          <div className={styles.mascot}>
            <div className={styles.mascotFace}>
              <div className={styles.mascotEyes}>
                <span>^</span>
                <span>^</span>
              </div>
              <div className={styles.mascotMouth}>ω</div>
            </div>
            <FaHeart className={styles.mascotHeart} size={16} />
          </div>
        </div>
        <h1 className={styles.title}>Игровая комната</h1>
        <p className={styles.subtitle}>Проведите время весело, играя вместе с партнером</p>
      </header>
      
      <main className={styles.gameGridContainer}>
        <div className={styles.gameGrid}>
        {GAME_ITEMS.map((game, index) => (
          <Link to={game.path} key={game.id} className={styles.gameCard}>
            <div className={styles.cardBackground} style={{ background: game.gradient }}>
              <div className={styles.cardImage}>
                <img src={game.image} alt={game.name} />
              </div>
              <div className={styles.cardOverlay}></div>
            </div>
            
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{game.name}</h3>
              </div>
              <p className={styles.cardDescription}>{game.description}</p>
            </div>
            
            <div className={styles.cardHover}>
              <div className={styles.playButton}>
                <span>Играть</span>
              </div>
            </div>
          </Link>
        ))}
        </div>
      </main>
      
      <div className={styles.floatingElements}>
        <div className={styles.floatingHeart} style={{ '--delay': '0s' }}>💕</div>
        <div className={styles.floatingHeart} style={{ '--delay': '2s' }}>💖</div>
        <div className={styles.floatingHeart} style={{ '--delay': '4s' }}>💝</div>
      </div>
    </div>
  );
};

export default GamesPage;