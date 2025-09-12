import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useUser, useAuthLoading } from '@/store';
import { usePairing } from '../../hooks/usePairing';
import { useEvents } from '@/modules/events/hooks/useEvents';
import styles from './ProfilePage.module.css';
import { userService, pairService } from '@/services';
import { interestService } from '../../services';
import { 
  FaUser, FaEnvelope, FaMapMarkerAlt, FaBirthdayCake, 
  FaCoins, FaCalendarAlt, FaGamepad, FaCommentDots, FaChartLine,
  FaHeart, FaStar, FaEdit, FaShare, FaUsers, FaPlus
} from 'react-icons/fa';
import manAvatar from '@/shared/assets/man.png';
import womanAvatar from '@/shared/assets/woman.png';
import defaultAvatar from '@/shared/assets/react.svg';

interface UserInterest {
  id: string;
  interest_id: string;
  preference: 'love' | 'like' | 'neutral' | 'dislike';
  intensity: number;
  Interest: {
    id: string;
    name: string;
    category: string;
    emoji?: string;
  };
}

interface ExtendedUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  gender?: 'male' | 'female';
  avatarUrl?: string;
  city?: string;
  age?: number;
  coins?: number;
}
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
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [isInterestsLoading, setIsInterestsLoading] = useState(true);
  const [interestsError, setInterestsError] = useState<string | null>(null);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [isPairingSubmitting, setIsPairingSubmitting] = useState(false);
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

  // Загрузка интересов пользователя
  useEffect(() => {
    const loadUserInterests = async () => {
      if (!userId) return;
      setIsInterestsLoading(true);
      setInterestsError(null);
      try {
        const response = await interestService.getUserInterests(userId);
        setUserInterests(response || []);
        
        if (!response || response.length === 0) {
          setInterestsError('Интересы не найдены. Вы можете добавить их в настройках.');
        }
      } catch (error) {
        console.error('Ошибка загрузки интересов:', error);
        setInterestsError('Не удалось загрузить интересы. Попробуйте обновить страницу.');
      } finally {
        setIsInterestsLoading(false);
      }
    };
    loadUserInterests();
  }, [userId]);

  // Функция отправки запроса на создание пары
  const handleSendPairRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail.trim()) return;
    
    setIsPairingSubmitting(true);
    setPairingError(null);
    
    try {
      await sendRequest(partnerEmail.trim());
      setPartnerEmail('');
      setIsPairingModalOpen(false);
      // Показать уведомление об успехе
    } catch (error: any) {
      console.error('Ошибка отправки запроса:', error);
      setPairingError(
        error.response?.data?.message || 
        'Не удалось отправить запрос. Проверьте email и попробуйте снова.'
      );
    } finally {
      setIsPairingSubmitting(false);
    }
  };
  
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
              <button 
                className={styles.contactPartnerButton}
                onClick={() => {
                  // Открыть чат с партнером или перейти к чату
                  window.location.href = '/chat'; // Можно заменить на нужный маршрут
                }}
              >
                <FaCommentDots />
                Написать сообщение
              </button>
            </motion.div>
          )}

          {/* Pairing Section - если нет партнера */}
          {!partner && (
            <motion.div 
              className={styles.sidebarPairingCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <h3 className={styles.sidebarTitle}>
                <FaUsers />
                Найти пару
              </h3>
              <p className={styles.pairingDescription}>
                Пригласите свою вторую половинку чтобы начать совместное путешествие!
              </p>
              <button 
                className={styles.invitePartnerButton}
                onClick={() => setIsPairingModalOpen(true)}
              >
                <FaPlus />
                Пригласить партнера
              </button>
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
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FaStar className={styles.titleIcon} />
                Интересы и увлечения
              </h2>
              <button 
                className={styles.editInterestsButton}
                onClick={() => window.location.href = '/onboarding/interests?mode=edit'}
                title="Редактировать интересы"
              >
                <FaEdit />
              </button>
            </div>
            
            {isInterestsLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Загрузка интересов...</p>
              </div>
            ) : interestsError ? (
              <div className={styles.errorContainer}>
                <p className={styles.errorText}>{interestsError}</p>
                <button 
                  className={styles.retryButton}
                  onClick={() => window.location.reload()}
                >
                  Обновить страницу
                </button>
              </div>
            ) : userInterests.length > 0 ? (
              <div className={styles.tagGrid}>
                {userInterests.map((userInterest, index) => {
                  const interest = userInterest.Interest;
                  const preferenceColor = {
                    'love': 'var(--color-primary-dark)', /* WCAG compliant */
                    'like': '#3B82F6', 
                    'neutral': '#6B7280',
                    'dislike': '#EF4444'
                  }[userInterest.preference];
                  
                  return (
                    <motion.div 
                      key={userInterest.id}
                      className={styles.tagCard}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      style={{ borderColor: preferenceColor }}
                    >
                      <span className={styles.tagName}>
                        {interest.emoji && <span className={styles.tagEmoji}>{interest.emoji}</span>}
                        {interest.name}
                      </span>
                      <div className={styles.tagIntensity}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <span 
                            key={i} 
                            className={`${styles.intensityDot} ${i < Math.ceil(userInterest.intensity / 2) ? styles.active : ''}`}
                            style={{ backgroundColor: i < Math.ceil(userInterest.intensity / 2) ? preferenceColor : '#E5E7EB' }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyContainer}>
                <FaPlus className={styles.emptyIcon} />
                <p className={styles.emptyText}>
                  У вас пока нет добавленных интересов
                </p>
                <button 
                  className={styles.addInterestsButton}
                  onClick={() => window.location.href = '/onboarding/interests'}
                >
                  Добавить интересы
                </button>
              </div>
            )}
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

      {/* Модальное окно для приглашения партнера */}
      {isPairingModalOpen && (
        <div className={styles.modal} onClick={() => setIsPairingModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Пригласить партнера</h2>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setIsPairingModalOpen(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSendPairRequest} className={styles.pairingForm}>
              <div className={styles.formGroup}>
                <label htmlFor="partnerEmail" className={styles.formLabel}>
                  Email партнера
                </label>
                <input
                  id="partnerEmail"
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="partner@example.com"
                  className={styles.formInput}
                  required
                  disabled={isPairingSubmitting}
                />
              </div>
              
              {pairingError && (
                <div className={styles.errorMessage}>
                  {pairingError}
                </div>
              )}
              
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.secondaryButton}
                  onClick={() => setIsPairingModalOpen(false)}
                  disabled={isPairingSubmitting}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className={styles.primaryButton}
                  disabled={isPairingSubmitting || !partnerEmail.trim()}
                >
                  {isPairingSubmitting ? 'Отправляем...' : 'Отправить приглашение'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;

