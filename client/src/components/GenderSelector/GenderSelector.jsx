import React from 'react';
import maleAvatar from '../../assets/man.png';
import femaleAvatar from '../../assets/woman.png';
import styles from './GenderSelector.module.css';
const GenderSelector = ({ selectedGender, onGenderChange }) => {
  return (
    <div className={styles.genderSelector}>
      <label className={styles.label}>Выберите пол</label>
      <div className={styles.avatarContainer}>
        <div 
          className={`${styles.avatarOption} ${selectedGender === 'male' ? styles.selected : ''}`}
          onClick={() => onGenderChange('male')}
        >
          <div className={styles.avatarWrapper}>
            <img src={maleAvatar} alt="Мужской" className={styles.avatar} />
          </div>
          <span className={styles.avatarLabel}>Мужской</span>
        </div>
        <div 
          className={`${styles.avatarOption} ${selectedGender === 'female' ? styles.selected : ''}`}
          onClick={() => onGenderChange('female')}
        >
          <div className={styles.avatarWrapper}>
            <img src={femaleAvatar} alt="Женский" className={styles.avatar} />
          </div>
          <span className={styles.avatarLabel}>Женский</span>
        </div>
      </div>
      <button 
        type="button"
        className={`${styles.otherButton} ${selectedGender === 'other' ? styles.selected : ''}`}
        onClick={() => onGenderChange('other')}
      >
        Другое
      </button>
    </div>
  );
};
export default GenderSelector; 
