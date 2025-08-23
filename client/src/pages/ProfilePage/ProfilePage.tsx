import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useUser, useAuthLoading } from '../../store/hooks';
import { usePairing } from '../../hooks/usePairing';
import { useEvents } from '../../hooks/useEvents';
import styles from './ProfilePage.module.css';
import userService from '../../services/user.service';
import ActivityFeed from '../../components/Profile/ActivityFeed';
import PairingWidget from '../../components/Profile/PairingWidget';
import { 
  FaUser, FaEnvelope, FaMapMarkerAlt, FaBirthdayCake, 
  FaCoins, FaCalendarAlt, FaGamepad, FaCommentDots, FaChartLine,
  FaHeart, FaStar, FaEdit, FaShare
} from 'react-icons/fa';
import manAvatar from '../../assets/man.png';
import womanAvatar from '../../assets/woman.png';
import defaultAvatar from '../../assets/react.svg';
// Используем тип User из Redux, но расширяем его для локальных потребностей
type ExtendedUser = any; // Временно используем any для упрощения
const ProfilePage: React.FC = () => {
  const user = useUser();
  const isAuthLoading = useAuthLoading();
  // Мемоизируем пользователя для стабильности хуков
  const stableUser = useMemo(() => user, [user?.id, user?.email, user?.first_name]);
  const userId = useMemo(() => user?.id, [user?.id]);
  
  const { pairing, isLoading: isPairingLoading, sendRequest, deletePairing } = usePairing(stableUser);
  const { events, isLoading: areEventsLoading, deleteEvent } = useEvents(userId);
  const [stats, setStats] = useState({
    events: 0,
    memories: 0,
    gamesPlayed: 0,
    daysSinceRegistration: 0,
    coins: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const getAvatar = (targetUser: ExtendedUser | null = user): string => {
    if (targetUser?.avatarUrl) return targetUser.avatarUrl;
    if (targetUser?.gender === 'male') return manAvatar;
    if (targetUser?.gender === 'female') return womanAvatar;
    return defaultAvatar;
  };
  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return;
      setIsStatsLoading(true);
      try {
        const response = await userService.getProfileStats();
        setStats(response.data);
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      } finally {
        setIsStatsLoading(false);
      }
    };
    loadStats();
  }, [userId]);
  
  // AppRoutes уже обрабатывает случай отсутствия пользователя
  if (!user) {
    return <div className={styles.loader}>Загрузка данных пользователя...</div>;
  }
  const partner = (pairing as any)?.status === 'active' 
    ? ((pairing as any)?.Requester?.id === user?.id ? (pairing as any)?.Receiver : (pairing as any)?.Requester)
    : null;
  const statItems = [
    { icon: FaCoins, value: stats.coins, label: 'Монет' },
    { icon: FaCalendarAlt, value: stats.events, label: 'Событий' },
    { icon: FaGamepad, value: stats.gamesPlayed, label: 'Игр' },
    { icon: FaCommentDots, value: stats.memories, label: 'Воспоминаний' },
    { icon: FaChartLine, value: stats.daysSinceRegistration, label: 'Дней с нами' },
  ];
  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileLayout}>
        {/* Left Sidebar */}
        <motion.div 
          className={styles.profileSidebar}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* User Info Card */}
          <div className={styles.userCard}>
            <motion.img 
              src={getAvatar()} 
              alt="Profile Avatar" 
              className={styles.userAvatar}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            />
            
            <motion.h1 
              className={styles.userName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {(user as any).display_name || user.first_name || 'Пользователь'} {(user as any).last_name || ''}
            </motion.h1>
            
            <motion.p 
              className={styles.userBio}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {(user as any).bio || 'Участник LoveMemory ❤️'}
            </motion.p>

            {/* Quick Stats */}
            <motion.div 
              className={styles.quickStats}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {statItems.slice(0, 3).map((item, index) => (
                <motion.div 
                  key={index} 
                  className={styles.quickStatItem}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                >
                  <span className={styles.quickStatNumber}>
                    {isStatsLoading ? '...' : item.value.toLocaleString()}
                  </span>
                  <span className={styles.quickStatLabel}>{item.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className={styles.sidebarActions}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <motion.button 
                className={styles.primaryButton}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaEdit />
                Редактировать профиль
              </motion.button>
              <motion.button 
                className={styles.secondaryButton}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaShare />
                Поделиться
              </motion.button>
            </motion.div>
          </div>

          {/* Contact Info */}
          <motion.div 
            className={styles.contactCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <h3 className={styles.sidebarTitle}>Контакты</h3>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <FaEnvelope className={styles.contactIcon} />
                <span className={styles.contactText}>{user.email}</span>
              </div>
              <div className={styles.contactItem}>
                <FaBirthdayCake className={styles.contactIcon} />
                <span className={styles.contactText}>
                  {(user as any).age ? `${(user as any).age} лет` : 'Возраст не указан'}
                </span>
              </div>
              <div className={styles.contactItem}>
                <FaMapMarkerAlt className={styles.contactIcon} />
                <span className={styles.contactText}>
                  {user.city || 'Город не указан'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Partner Card */}
          {partner && (
            <motion.div 
              className={styles.sidebarPartnerCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <h3 className={styles.sidebarTitle}>
                <FaHeart />
                Партнер
              </h3>
              <div className={styles.partnerInfo}>
                <motion.img 
                  src={getAvatar(partner)} 
                  alt="Partner" 
                  className={styles.partnerAvatar}
                  whileHover={{ scale: 1.05 }}
                />
                <div className={styles.partnerDetails}>
                  <h4>{partner.first_name || partner.last_name || 'Пользователь'}</h4>
                  <p>Активная пара</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Main Content Area */}
        <motion.div 
          className={styles.mainContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Stats Overview */}
          <motion.div 
            className={styles.statsOverview}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <h2 className={styles.sectionTitle}>Статистика активности</h2>
            <div className={styles.statsGrid}>
              {statItems.map((item, index) => (
                <motion.div 
                  key={index} 
                  className={styles.statCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                >
                  <div className={styles.statIcon}>
                    <item.icon />
                  </div>
                  <div className={styles.statValue}>
                    {isStatsLoading ? '...' : item.value.toLocaleString()}
                  </div>
                  <div className={styles.statLabel}>{item.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Interests & Tags */}
          <motion.div 
            className={styles.interestsSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <h2 className={styles.sectionTitle}>
              <FaStar className={styles.titleIcon} />
              Интересы и увлечения
            </h2>
            <div className={styles.tagGrid}>
              {['Семья', 'Путешествия', 'Хобби', 'Романтика', 'Игры', 'Кулинария', 'Спорт', 'Музыка'].map((tag, index) => (
                <motion.div 
                  key={tag}
                  className={styles.tagCard}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <span className={styles.tagName}>{tag}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div 
            className={styles.activitySection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.5 }}
          >
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FaChartLine className={styles.titleIcon} />
                Последняя активность
              </h2>
              <motion.button 
                className={styles.viewAllButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Посмотреть все
              </motion.button>
            </div>
            
            {areEventsLoading ? (
              <div className={styles.activityLoading}>
                <div className={styles.spinner}></div>
                <span>Загрузка активности...</span>
              </div>
            ) : (
              <div className={styles.activityGrid}>
                <motion.div 
                  className={styles.activityCard}
                  whileHover={{ y: -2 }}
                >
                  <div className={styles.activityIcon}>
                    <FaCalendarAlt />
                  </div>
                  <div className={styles.activityContent}>
                    <h4>События</h4>
                    <p>{events?.length || 0} созданных событий</p>
                    <span className={styles.activityTime}>За все время</span>
                  </div>
                </motion.div>

                <motion.div 
                  className={styles.activityCard}
                  whileHover={{ y: -2 }}
                >
                  <div className={styles.activityIcon}>
                    <FaGamepad />
                  </div>
                  <div className={styles.activityContent}>
                    <h4>Игры</h4>
                    <p>{stats.gamesPlayed} сыгранных партий</p>
                    <span className={styles.activityTime}>Недавно</span>
                  </div>
                </motion.div>

                <motion.div 
                  className={styles.activityCard}
                  whileHover={{ y: -2 }}
                >
                  <div className={styles.activityIcon}>
                    <FaHeart />
                  </div>
                  <div className={styles.activityContent}>
                    <h4>Воспоминания</h4>
                    <p>{stats.memories} сохраненных моментов</p>
                    <span className={styles.activityTime}>За месяц</span>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
export default ProfilePage;

