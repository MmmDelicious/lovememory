import React from 'react';
import styles from './ProfileInfo.module.css';
import { FaEnvelope, FaGift, FaMapMarkerAlt } from 'react-icons/fa';
const ProfileInfo = ({ user, partner, partnerAvatar }) => {
  return (
    <div className={styles.infoWrapper}>
      <div className={styles.contactSection}>
        <h3 className={styles.sectionTitle}>Контактная информация</h3>
        <div className={styles.contactItem}><FaEnvelope /><span>{user.email}</span></div>
        <div className={styles.contactItem}><FaGift /><span>{user.age ?? 'Возраст не указан'}</span></div>
        <div className={styles.contactItem}><FaMapMarkerAlt /><span>{user.city || 'Город не указан'}</span></div>
      </div>
      <div className={styles.tagsSection}>
        <h3 className={styles.sectionTitle}>Теги (в разработке)</h3>
        <div className={styles.tagsContainer}>
          <div className={styles.tag}><span>семья</span></div>
          <div className={styles.tag}><span>путешествия</span></div>
          <div className={styles.tag}><span>хобби</span></div>
        </div>
      </div>
      {partner && (
        <div className={styles.partnerSection}>
          <img src={partnerAvatar} alt="Partner" className={styles.partnerAvatar} />
          <span className={styles.partnerText}>В паре с: {partner.first_name || partner.last_name || 'Пользователь'}</span>
        </div>
      )}
    </div>
  );
};
export default ProfileInfo;
