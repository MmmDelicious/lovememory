import React from 'react';
import manAvatar from '../../assets/man.PNG';
import womanAvatar from '../../assets/woman.PNG';
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
          <img src={manAvatar} alt="Мужской" className={styles.avatar} />
          <span className={styles.avatarLabel}>Мужской</span>
        </div>
        
        <div 
          className={`${styles.avatarOption} ${selectedGender === 'female' ? styles.selected : ''}`}
          onClick={() => onGenderChange('female')}
        >
          <img src={womanAvatar} alt="Женский" className={styles.avatar} />
          <span className={styles.avatarLabel}>Женский</span>
        </div>
      </div>
      
      {selectedGender === 'other' && (
        <div className={styles.otherOption}>
          <span className={styles.otherLabel}>Другое</span>
        </div>
      )}
      
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