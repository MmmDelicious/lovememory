import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileModule } from '../../modules';
import { useAuth } from '../../../../modules/auth/hooks/useAuth';
import styles from './ProfilePage.module.css';

/**
 * Тонкая страница профиля
 * Содержит только навигационную логику, всю бизнес-логику делегирует модулю ProfileModule
 */
const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Обработчики навигации
  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleStatClick = (statKey: string) => {
    // Навигация к соответствующим разделам
    switch (statKey) {
      case 'events':
        navigate('/calendar');
        break;
      case 'memories':
        navigate('/memories');
        break;
      // case 'gamesPlayed': // Игры временно скрыты
      //   navigate('/games');
      //   break;
      case 'messages':
        navigate('/chat');
        break;
      default:
        console.log('Clicked stat:', statKey);
    }
  };

  const handleInterestClick = (interest: any) => {
    // Можно открыть модал с деталями интереса
    console.log('Clicked interest:', interest);
  };

  const handleAddInterest = () => {
    navigate('/profile/interests');
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Необходима авторизация для просмотра профиля</div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <ProfileModule
        userId={user?.id}
        onEditProfile={handleEditProfile}
        onStatClick={handleStatClick}
        onInterestClick={handleInterestClick}
        onAddInterest={handleAddInterest}
      />
    </div>
  );
};

export default ProfilePage;