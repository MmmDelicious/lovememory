import React from 'react';
import { Avatar } from '../../../ui/profile';
import { MapPin, Calendar, Edit3 } from 'lucide-react';
import styles from './ProfileCard.module.css';

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatarUrl?: string;
  gender?: 'male' | 'female' | 'other';
  city?: string;
  age?: number;
  bio?: string;
}

interface ProfileCardProps {
  user: User;
  isOwnProfile?: boolean;
  onEdit?: () => void;
  onAvatarClick?: () => void;
  variant?: 'default' | 'sidebar';
  className?: string;
}

/**
 * Компонент карточки профиля пользователя
 * Использует UI компоненты, содержит логику отображения профиля
 */
const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  isOwnProfile = false,
  onEdit,
  onAvatarClick,
  variant = 'default',
  className = ''
}) => {
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Пользователь';
  
  if (variant === 'sidebar') {
    return (
      <div className={`${styles.userCard} ${className}`}>
        <Avatar
          src={user.avatarUrl}
          alt={displayName}
          size="medium"
          gender={user.gender}
          onClick={onAvatarClick}
          className={styles.userAvatar}
        />
        
        <h3 className={styles.userName}>{displayName}</h3>
        
        {user.bio && (
          <p className={styles.userBio}>{user.bio}</p>
        )}
        
        {/* Quick Stats - простая заглушка для сайдбара */}
        <div className={styles.quickStats}>
          <div className={styles.quickStatItem}>
            <span className={styles.quickStatNumber}>15</span>
            <span className={styles.quickStatLabel}>События</span>
          </div>
          <div className={styles.quickStatItem}>
            <span className={styles.quickStatNumber}>8</span>
            <span className={styles.quickStatLabel}>Память</span>
          </div>
          <div className={styles.quickStatItem}>
            <span className={styles.quickStatNumber}>5</span>
            <span className={styles.quickStatLabel}>Игры</span>
          </div>
        </div>
        
        {/* Контактная информация */}
        <div className={styles.contactCard}>
          <div className={styles.contactItem}>
            <span className={styles.contactIcon}>📧</span>
            <span className={styles.contactText}>{user.email}</span>
          </div>
          {user.city && (
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📍</span>
              <span className={styles.contactText}>{user.city}</span>
            </div>
          )}
          {user.age && (
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>🎂</span>
              <span className={styles.contactText}>{user.age} лет</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.header}>
        <Avatar
          src={user.avatarUrl}
          alt={displayName}
          size="xl"
          gender={user.gender}
          onClick={onAvatarClick}
          className={styles.avatar}
        />
        
        <div className={styles.info}>
          <div className={styles.nameContainer}>
            <h2 className={styles.name}>{displayName}</h2>
            {isOwnProfile && onEdit && (
              <button 
                onClick={onEdit}
                className={styles.editButton}
                aria-label="Редактировать профиль"
              >
                <Edit3 size={16} />
              </button>
            )}
          </div>
          
          <p className={styles.email}>{user.email}</p>
          
          <div className={styles.details}>
            {user.city && (
              <div className={styles.detail}>
                <MapPin size={16} className={styles.detailIcon} />
                <span>{user.city}</span>
              </div>
            )}
            
            {user.age && (
              <div className={styles.detail}>
                <Calendar size={16} className={styles.detailIcon} />
                <span>{user.age} лет</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {user.bio && (
        <div className={styles.bio}>
          <h3 className={styles.bioTitle}>О себе</h3>
          <p className={styles.bioText}>{user.bio}</p>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
