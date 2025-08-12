import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePairing } from '../../hooks/usePairing';
import { useEvents } from '../../hooks/useEvents';
import styles from './ProfilePage.module.css';

// Импорт новых компонентов
import ProfileHeader from '../../components/Profile/ProfileHeader';
import ProfileInfo from '../../components/Profile/ProfileInfo';
import ActivityFeed from '../../components/Profile/ActivityFeed';
import PairingWidget from '../../components/Profile/PairingWidget';
import TelegramWidget from '../../components/Profile/TelegramWidget';

// Аватары
import manAvatar from '../../assets/man.png';
import womanAvatar from '../../assets/woman.png';
import defaultAvatar from '../../assets/react.svg';

const ProfilePage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { pairing, isLoading: isPairingLoading, sendRequest, deletePairing, saveTelegramId } = usePairing(user);
  const { events, isLoading: areEventsLoading, deleteEvent } = useEvents(user?.id);

  const getAvatar = (targetUser = user) => {
    if (targetUser?.avatarUrl) return targetUser.avatarUrl;
    if (targetUser?.gender === 'male') return manAvatar;
    if (targetUser?.gender === 'female') return womanAvatar;
    return defaultAvatar;
  };

  if (isAuthLoading) {
    return <div className={styles.loader}>Загрузка профиля...</div>;
  }
  if (!user) {
    return <div className={styles.loader}>Пользователь не найден.</div>;
  }

  const partner = pairing?.status === 'active' 
    ? (pairing.Requester.id === user.id ? pairing.Receiver : pairing.Requester)
    : null;

  return (
    <div className={styles.pageGrid}>
      <div className={styles.header}>
        <ProfileHeader user={user} avatar={getAvatar()} />
      </div>

      <div className={styles.info}>
        <ProfileInfo user={user} partner={partner} partnerAvatar={partner ? getAvatar(partner) : null} />
      </div>
      
      <div className={styles.feed}>
        <ActivityFeed 
          events={events}
          areEventsLoading={areEventsLoading}
          deleteEvent={deleteEvent}
        />
      </div>

      <div className={styles.widgets}>
        <PairingWidget
          pairing={pairing}
          isPairingLoading={isPairingLoading}
          partner={partner}
          sendRequest={sendRequest}
          deletePairing={deletePairing}
        />
        <TelegramWidget 
          initialTelegramId={user.telegram_chat_id}
          saveTelegramId={saveTelegramId}
        />
      </div>
    </div>
  );
};

export default ProfilePage;