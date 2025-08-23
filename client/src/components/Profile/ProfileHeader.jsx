import React from 'react';
import styles from './ProfileHeader.module.css';
import { FaStar, FaStarHalfAlt, FaHeart } from 'react-icons/fa';
const ProfileHeader = ({ user, avatar }) => {
  return (
    <div className={styles.profileHeader}>
      <img src={avatar} alt="User Avatar" className={styles.avatar} />
      <h1 className={styles.name}>{user.display_name || user.first_name || 'Пользователь'} {user.last_name}</h1>
      <p className={styles.bio}>{user.bio || 'Участник LoveMemory'}</p>
      <div className={styles.stats}>
        <div className={styles.stars}>
          <FaStar /><FaStar /><FaStar /><FaStar /><FaStarHalfAlt />
        </div>
        <div className={styles.engagement}><FaHeart /><span>{user.love_coins || 0}</span></div>
      </div>
    </div>
  );
};
export default ProfileHeader;
