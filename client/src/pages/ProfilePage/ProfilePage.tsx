import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePairing } from '../../hooks/usePairing';
import { useEvents } from '../../hooks/useEvents';
import styles from './ProfilePage.module.css';
import userService from '../../services/user.service';
import ActivityFeed from '../../components/Profile/ActivityFeed';
import PairingWidget from '../../components/Profile/PairingWidget';
import { 
  FaUser, FaEnvelope, FaMapMarkerAlt, FaBirthdayCake, 
  FaCoins, FaCalendarAlt, FaGamepad, FaCommentDots, FaChartLine,
  FaHeart, FaStar
} from 'react-icons/fa';
import manAvatar from '../../assets/man.png';
import womanAvatar from '../../assets/woman.png';
import defaultAvatar from '../../assets/react.svg';
interface User {
  id: string;
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'other';
  telegram_chat_id?: string;
  [key: string]: any;
}
const ProfilePage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { pairing, isLoading: isPairingLoading, sendRequest, deletePairing } = usePairing(user);
  const { events, isLoading: areEventsLoading, deleteEvent } = useEvents(user?.id);
  const [stats, setStats] = useState({
    events: 0,
    memories: 0,
    gamesPlayed: 0,
    daysSinceRegistration: 0,
    coins: 0,
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const getAvatar = (targetUser: User | null = user): string => {
    if (targetUser?.avatarUrl) return targetUser.avatarUrl;
    if (targetUser?.gender === 'male') return manAvatar;
    if (targetUser?.gender === 'female') return womanAvatar;
    return defaultAvatar;
  };
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      setIsStatsLoading(true);
      try {
        const response = await userService.getProfileStats();
        setStats(response.data);
      } catch (error) {
      } finally {
        setIsStatsLoading(false);
      }
    };
    loadStats();
  }, [user]);
  if (isAuthLoading) {
    return <div className={styles.loader}>Загрузка профиля...</div>;
  }
  if (!user) {
    return <div className={styles.loader}>Пользователь не найден.</div>;
  }
  const partner = pairing?.status === 'active' 
    ? (pairing.Requester.id === user.id ? pairing.Receiver : pairing.Requester)
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
      <div className={styles.profileWrapper}>
        {}
        <div className={styles.profileCard}>
          {}
          <div className={styles.profileHeader}>
            <img 
              src={getAvatar()} 
              alt="Profile Avatar" 
              className={styles.profileAvatar} 
            />
            <h1 className={styles.profileName}>
              {user.display_name || user.first_name || 'Пользователь'} {user.last_name || ''}
            </h1>
            <p className={styles.profileBio}>
              {user.bio || 'Участник LoveMemory ❤️'}
            </p>
            {}
            <div className={styles.profileStats}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>
                  {isStatsLoading ? '...' : stats.events}
                </div>
                <div className={styles.statLabel}>События</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>
                  {isStatsLoading ? '...' : stats.memories}
                </div>
                <div className={styles.statLabel}>Воспоминания</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>
                  {isStatsLoading ? '...' : stats.coins}
                </div>
                <div className={styles.statLabel}>Монеты</div>
              </div>
            </div>
          </div>
          {}
          <div className={styles.profileContent}>
            <div className={styles.contentGrid}>
              {}
              <div className={styles.contactCard}>
                <h3 className={styles.cardTitle}>
                  <FaUser />
                  Контактная информация
                </h3>
                <div className={styles.contactList}>
                  <div className={styles.contactItem}>
                    <div className={styles.contactIcon}>
                      <FaEnvelope />
                    </div>
                    <span className={styles.contactText}>{user.email}</span>
                  </div>
                  <div className={styles.contactItem}>
                    <div className={styles.contactIcon}>
                      <FaBirthdayCake />
                    </div>
                    <span className={styles.contactText}>
                      {user.age ? `${user.age} лет` : 'Возраст не указан'}
                    </span>
                  </div>
                  <div className={styles.contactItem}>
                    <div className={styles.contactIcon}>
                      <FaMapMarkerAlt />
                    </div>
                    <span className={styles.contactText}>
                      {user.city || 'Город не указан'}
                    </span>
                  </div>
                </div>
              </div>
              {}
              <div className={styles.tagsCard}>
                <h3 className={styles.cardTitle}>
                  <FaStar />
                  Интересы
                </h3>
                <div className={styles.tagsList}>
                  <span className={styles.tag}>Семья</span>
                  <span className={styles.tag}>Путешествия</span>
                  <span className={styles.tag}>Хобби</span>
                  <span className={styles.tag}>Романтика</span>
                  <span className={styles.tag}>Игры</span>
                </div>
              </div>
              {}
              {partner && (
                <div className={styles.partnerCard}>
                  <h3 className={styles.cardTitle}>
                    <FaHeart />
                    В паре с
                  </h3>
                  <div className={styles.partnerInfo}>
                    <img 
                      src={getAvatar(partner)} 
                      alt="Partner" 
                      className={styles.partnerAvatar} 
                    />
                    <div className={styles.partnerDetails}>
                      <h4>{partner.first_name || partner.last_name || 'Пользователь'}</h4>
                      <p>Партнер • Активная пара</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {}
            <div className={styles.statsGrid}>
              {statItems.map((item, index) => (
                <div key={index} className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <item.icon />
                  </div>
                  <div className={styles.statValue}>
                    {isStatsLoading ? '...' : item.value.toLocaleString()}
                  </div>
                  <div className={styles.statLabel}>{item.label}</div>
                </div>
              ))}
            </div>
            {}
            <div className={styles.widgetsGrid}>
              <PairingWidget
                pairing={pairing}
                isPairingLoading={isPairingLoading}
                partner={partner}
                sendRequest={sendRequest}
                deletePairing={deletePairing}
              />
            </div>
            {}
            <ActivityFeed 
              events={events}
              areEventsLoading={areEventsLoading}
              deleteEvent={deleteEvent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;

