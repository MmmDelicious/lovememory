import React from 'react';
import { Link } from 'react-router-dom';
import styles from './GamesPage.module.css';
import { FaChess, FaTicketAlt, FaBrain } from 'react-icons/fa';
import { PiCardsFill } from "react-icons/pi";

const CLASSIC_GAMES = [
  {
    id: 'tic-tac-toe',
    name: 'Крестики-нолики',
    description: 'Классическая игра для двух игроков. Соберите три своих знака в ряд!',
    icon: <FaTicketAlt size={32} />,
    path: '/games/tic-tac-toe',
  },
  {
    id: 'chess',
    name: 'Шахматы',
    description: 'Стратегическая игра для двух игроков. Поставьте мат королю соперника.',
    icon: <FaChess size={32} />,
    path: '/games/chess',
  },
  {
    id: 'quiz',
    name: 'Квиз',
    description: 'Интеллектуальная игра для двух игроков. Отвечайте на вопросы быстрее соперника!',
    icon: <FaBrain size={32} />,
    path: '/games/quiz',
  }
];

const GamesPage = () => {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Игровой Хаб</h1>
        <p className={styles.subtitle}>Выберите игру, чтобы весело провести время вместе.</p>
      </header>
      
      <div className={styles.gamesList}>
        {CLASSIC_GAMES.map(game => (
          <Link to={game.path} key={game.id} className={styles.gameCard}>
            <div className={styles.gameIcon}>{game.icon}</div>
            <div className={styles.gameInfo}>
                <h3 className={styles.gameName}>{game.name}</h3>
                <p className={styles.gameDescription}>{game.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.divider}></div>

      <Link to="/love-vegas" className={styles.loveVegasCard}>
        <div className={styles.vegasIcon}><PiCardsFill size={40} /></div>
        <div className={styles.vegasInfo}>
          <h2 className={styles.loveVegasTitle}>LoveVegas</h2>
          <p className={styles.loveVegasDescription}>Азартные игры для тех, кто любит рисковать. Только для пар!</p>
        </div>
        <div className={styles.vegasCta}>Перейти</div>
      </Link>
    </div>
  );
};

export { GamesPage };