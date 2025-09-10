import React from 'react';
import { useAIMascot, useMascotActions } from '../../../../store/hooks';
import styles from './AIToggleButton.module.css';
import mascotIcon from '../../../../shared/assets/AI.json';
import Lottie from 'lottie-react';

const AIToggleButton = () => {
  const { isVisible } = useAIMascot();
  
  const { toggleAI } = useMascotActions();

  return (
    <button 
      className={`${styles.toggleButton} ${isVisible ? styles.active : ''}`}
      onClick={toggleAI}
      aria-label="Toggle AI Assistant"
    >
      <div className={styles.lottieIcon}>
        <Lottie animationData={mascotIcon} loop={true} />
      </div>
    </button>
  );
};

export default AIToggleButton;
