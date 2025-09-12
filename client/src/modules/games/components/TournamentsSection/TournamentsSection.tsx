import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Crown, ChevronRight } from 'lucide-react';
import styles from './TournamentsSection.module.css';

const TournamentsSection: React.FC = () => {
  return (
    <section className={styles.tournamentsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <Trophy size={20} />
          Турниры
        </h2>
        <Link to="/games/tournaments" className={styles.sectionLink}>
          Смотреть все <ChevronRight size={16} />
        </Link>
      </div>
      <div className={styles.tournamentsPreview}>
        <div className={styles.tournamentCard}>
          <div className={styles.tournamentHeader}>
            <div className={styles.tournamentIcon}>
              <Trophy size={24} />
            </div>
            <div className={styles.tournamentInfo}>
              <h3>Еженедельный турнир</h3>
              <p>Соревнуйтесь с другими парами</p>
            </div>
          </div>
          <div className={styles.tournamentMeta}>
            <span>16 участников</span>
            <span>Начинается завтра</span>
          </div>
          <Link to="/games/tournaments" className={styles.tournamentAction}>
            Участвовать
          </Link>
        </div>
        <div className={styles.tournamentCard}>
          <div className={styles.tournamentHeader}>
            <div className={styles.tournamentIcon}>
              <Crown size={24} />
            </div>
            <div className={styles.tournamentInfo}>
              <h3>Создать турнир</h3>
              <p>Организуйте собственное соревнование</p>
            </div>
          </div>
          <div className={styles.tournamentMeta}>
            <span>Любые игры</span>
            <span>Ваши правила</span>
          </div>
          <Link to="/games/tournaments" className={styles.tournamentAction}>
            Создать
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TournamentsSection;
