import React, { useState, useEffect } from 'react';
import { 
  ProfileCard, 
  ProfileStats, 
  InterestsList, 
  PairConnectionCard 
} from '../../../../components/profile';
import { usePairing } from '../../hooks/usePairing';
import { userService, pairService } from '../../../../services';
import { interestService } from '../../services';
import { useUser } from '../../../../store/hooks';
import styles from './ProfileModule.module.css';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'other';
  city?: string;
  age?: number;
  bio?: string;
}

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

interface ProfileModuleProps {
  userId: string;
  onEditProfile?: () => void;
  onStatClick?: (statKey: string) => void;
  onInterestClick?: (interest: any) => void;
  onAddInterest?: () => void;
  className?: string;
}

/**
 * Модуль профиля - самостоятельный модуль со своей бизнес-логикой
 * Содержит состояние, API вызовы, обработку ошибок
 * Использует компоненты из слоя Components
 */
const ProfileModule: React.FC<ProfileModuleProps> = ({
  userId,
  onEditProfile,
  onStatClick,
  onInterestClick,
  onAddInterest,
  className = ''
}) => {
  // Получаем данные пользователя из store вместо моковых данных
  const currentUser = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [stats, setStats] = useState({
    events: 0,
    memories: 0,
    // gamesPlayed: 0, // Игры временно скрыты
    daysSinceRegistration: 0,
    coins: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interestsError, setInterestsError] = useState<string | null>(null);

  // Используем хук для работы с парой
  const { 
    pairing, 
    isLoading: isPairingLoading, 
    sendRequest, 
    deletePairing 
  } = usePairing({ id: userId } as any);

  // Загрузка данных пользователя
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        if (currentUser && currentUser.id === userId) {
          // Используем данные из store для текущего пользователя
          setUser({
            ...currentUser,
            bio: currentUser.bio || 'Люблю путешествовать, готовить и смотреть фильмы. Ищу интересные идеи для совместного времяпрепровождения! 💕'
          });
        } else {
          // Для других пользователей делаем API запрос
          const response = await userService.getProfile(userId);
          setUser(response.data);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Ошибка загрузки данных пользователя');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId, currentUser]);

  // Загрузка статистики
  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return;
      
      setStatsLoading(true);
      try {
        // Загружаем реальную статистику с сервера
        const response = await userService.getProfileStats(userId);
        setStats({
          events: response.data.events || 0,
          memories: response.data.memories || 0,
          // gamesPlayed: response.data.gamesPlayed || 0, // Игры временно скрыты
          daysSinceRegistration: response.data.daysSinceRegistration || 0,
          coins: currentUser?.coins || 0, // Берем из store
        });
      } catch (err) {
        console.error('Error loading stats:', err);
        // Fallback к базовым значениям если API недоступен
        setStats({
          events: 0,
          memories: 0,
          daysSinceRegistration: 0,
          coins: currentUser?.coins || 0,
        });
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [userId, currentUser]);

  // Загрузка интересов
  useEffect(() => {
    const loadInterests = async () => {
      if (!userId) return;
      
      setInterestsLoading(true);
      try {
        // Загружаем реальные интересы с сервера
        const response = await interestService.getUserInterests(userId);
        setUserInterests(response.data || []);
      } catch (err) {
        console.error('Error loading interests:', err);
        setInterestsError('Ошибка загрузки интересов');
      } finally {
        setInterestsLoading(false);
      }
    };

    loadInterests();
  }, [userId]);

  const handleSendPairRequest = async (email: string) => {
    try {
      await sendRequest(email);
    } catch (err) {
      console.error('Error sending pair request:', err);
    }
  };

  const handleDisconnectPair = async () => {
    try {
      await deletePairing();
    } catch (err) {
      console.error('Error disconnecting pair:', err);
    }
  };

  const handleRemoveInterest = async (interestId: string) => {
    try {
      await interestService.removeUserInterest(interestId);
      setUserInterests(prev => prev.filter(interest => interest.id !== interestId));
    } catch (err) {
      console.error('Error removing interest:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Загрузка профиля...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={styles.error}>
        <h3 className={styles.errorTitle}>Ошибка загрузки</h3>
        <p className={styles.errorText}>{error || 'Пользователь не найден'}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.profileLayout} ${className}`}>
      {/* Левый сайдбар */}
      <div className={styles.profileSidebar}>
        {/* Карточка пользователя */}
        <ProfileCard
          user={user}
          isOwnProfile={true}
          onEdit={onEditProfile}
          className={styles.userCard}
          variant="sidebar"
        />
        
        {/* Подключение к партнеру */}
        <PairConnectionCard
          partner={pairing?.partner}
          isConnected={!!pairing?.partner}
          connectionStatus={pairing?.status}
          onSendRequest={handleSendPairRequest}
          onDisconnect={handleDisconnectPair}
          loading={isPairingLoading}
          className={styles.sidebarPartnerCard}
          variant="sidebar"
        />
      </div>

      {/* Основной контент */}
      <div className={styles.mainContent}>
        {/* Статистика */}
        <div className={styles.statsSection}>
          <ProfileStats
            stats={stats}
            loading={statsLoading}
            onStatClick={onStatClick}
            variant="grid"
          />
        </div>

        {/* Интересы */}
        <div className={styles.interestsSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.titleIcon}>🎯</span>
              Мои интересы
            </h3>
          </div>
          
          {interestsError ? (
            <div className={styles.interestsError}>
              <p>{interestsError}</p>
              <button onClick={() => window.location.reload()}>
                Попробовать снова
              </button>
            </div>
          ) : (
            <InterestsList
              interests={userInterests}
              onInterestClick={onInterestClick}
              onInterestRemove={handleRemoveInterest}
              onAddInterest={onAddInterest}
              showAddButton={true}
              showIntensity={true}
              editable={true}
              loading={interestsLoading}
              variant="compact"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModule;
