import React from 'react';
import { Link } from 'react-router-dom';
import styles from './LoveVegasPage.module.css';

const VEGAS_GAMES = [
    {
        id: 'poker',
        name: 'Покер',
        description: 'Классический техасский холдем. Соберите лучшую комбинацию!',
        status: 'Доступно'
    }
];

const LoveVegasPage = () => {
    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.title}>Welcome to LoveVegas!</h1>
            <p className={styles.subtitle}>Выберите игру и испытайте свою удачу.</p>
            <div className={styles.gamesList}>
                {VEGAS_GAMES.map(game => (
                    <div key={game.id} className={styles.gameCard}>
                        <h3>{game.name}</h3>
                        <p>{game.description}</p>
                        <Link to={`/love-vegas/${game.id}`} className={styles.playButton}>Играть</Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LoveVegasPage;