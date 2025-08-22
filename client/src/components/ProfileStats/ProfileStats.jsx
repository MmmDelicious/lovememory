import React, { useState, useEffect, memo } from 'react';
import styles from './ProfileStats.module.css';
import userService from '../../services/user.service';
import { FaCoins, FaCalendarAlt, FaGamepad, FaCommentDots, FaChartLine } from 'react-icons/fa';
const ProfileStats = memo(({ user }) => {
  const [stats, setStats] = useState({
    events: 0,
    memories: 0,
    gamesPlayed: 0,
    daysSinceRegistration: 0,
    coins: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await userService.getProfileStats();
        setStats(response.data);
      } catch (err) {
        setError('Не удалось загрузить статистику');
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, [user]);
  const statItems = [
    {
      Icon: FaCoins,
      number: stats.coins,
      label: 'Монет',
    },
    {
      Icon: FaCalendarAlt,
      number: stats.events,
      label: 'Событий',
    },
    {
      Icon: FaGamepad,
      number: stats.gamesPlayed,
      label: 'Игр сыграно',
    },
    {
      Icon: FaCommentDots,
      number: stats.memories,
      label: 'Воспоминаний',
    },
    {
      Icon: FaChartLine,
      number: stats.daysSinceRegistration,
      label: 'Дней с регистрации',
    }
  ];
  if (isLoading) {
    return (
      <div className={styles.statsGrid}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`${styles.statCard} ${styles.loading}`}>
            <div className={styles.shimmerBox}></div>
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }
  return (
    <div className={styles.statsGrid}>
      {statItems.map((item, index) => (
        <div key={index} className={styles.statCard}>
          <div className={styles.iconWrapper}>
            <item.Icon className={styles.statIcon} />
          </div>
          <div className={styles.statNumber}>{item.number.toLocaleString()}</div>
          <div className={styles.statLabel}>{item.label}</div>
        </div>
      ))}
    </div>
  );
});
ProfileStats.displayName = 'ProfileStats';
export default ProfileStats;
