import React from 'react';
import Avatar from '../Avatar/Avatar';
import maleAvatar from '../../assets/man.png';
import femaleAvatar from '../../assets/woman.png';
import styles from './UserAvatar.module.css';
interface User {
  name?: string;
  avatarUrl?: string;
  gender?: 'male' | 'female';
}
interface UserAvatarProps {
  user?: User;
  size?: 'small' | 'medium' | 'large';
  variant?: 'circle' | 'rounded' | 'square' | 'default';
  className?: string;
}
const UserAvatar: React.FC<UserAvatarProps> = ({ user, size, variant, className }) => {
    const isFemale = user && user.gender === 'female';
    const getAvatarSrc = () => {
        if (user && user.avatarUrl) {
            return user.avatarUrl;
        }
        return isFemale ? femaleAvatar : maleAvatar;
    };
    const avatarClassName = [
        className,
        !isFemale ? styles.maleAvatar : styles.femaleAvatar
    ].filter(Boolean).join(' ');
    return (
        <Avatar
            src={getAvatarSrc()}
            alt={user ? `${user.name}'s avatar` : 'avatar'}
            size={size}
            variant={variant}
            className={avatarClassName}
        />
    );
};
export default UserAvatar;

