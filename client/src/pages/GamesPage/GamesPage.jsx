import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './GamesPage.module.css';

const GAMES_LIST = [
  {
    id: 'tic-tac-toe',
    name: 'Крестики-нолики',
    description: 'Классическая игра для двух игроков. Соберите три своих знака в ряд!',
    status: 'Доступно'
  },
  // --- ДОБАВЛЕННЫЙ БЛОК ---
  {
    id: 'chess',
    name: 'Шахматы',
    description: 'Вечная классика стратегии. Поставьте мат своему партнеру!',
    status: 'Доступно'
  },
  // -------------------------
  {
    id: 'guess-the-melody',
    name: 'Угадай мелодию',
    description: 'Проверьте свои музыкальные знания и угадайте мелодию быстрее соперника.',
    status: 'В разработке'
  },
];

const GamesPage = () => {
  const navigate = useNavigate();

  const handleGameSelect = (gameId) => {
    navigate(`/games/${gameId}`);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Игровой Хаб</h1>
      </div>
      <p className={styles.subtitle}>Выберите игру, чтобы посмотреть доступные комнаты или создать свою.</p>
      
      <div className={styles.gamesList}>
        {GAMES_LIST.map(game => (
          <div key={game.id} className={styles.gameCard}>
            <h3>{game.name}</h3>
            <p className={styles.gameDescription}>{game.description}</p>
            <span className={`${styles.gameStatus} ${game.status === 'Доступно' ? styles.available : styles.soon}`}>
              {game.status}
            </span>
            <button
              onClick={() => handleGameSelect(game.id)}
              className={styles.selectButton}
              disabled={game.status !== 'Доступно'}
            >
              Выбрать
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamesPage;