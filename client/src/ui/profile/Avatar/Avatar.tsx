import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large' | 'xl';
  gender?: 'male' | 'female' | 'other';
  onClick?: () => void;
  className?: string;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away';
}

/**
 * Переиспользуемый компонент аватара
 * Чистый UI компонент без бизнес-логики
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'medium',
  gender,
  onClick,
  className = '',
  showStatus = false,
  status = 'offline'
}) => {
  const getDefaultAvatar = () => {
    if (gender === 'male') return '/src/shared/assets/man.png';
    if (gender === 'female') return '/src/shared/assets/woman.png';
    return '/src/shared/assets/react.svg';
  };

  const avatarSrc = src || getDefaultAvatar();

  return (
    <div 
      className={`${styles.avatar} ${styles[size]} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
    >
      <img 
        src={avatarSrc} 
        alt={alt} 
        className={styles.image}
        loading="lazy"
      />
      {showStatus && (
        <div className={`${styles.statusIndicator} ${styles[status]}`} />
      )}
    </div>
  );
};

export default Avatar;
