import React from 'react';
import { useAIMascot } from '../../context/AIMascotContext';
import styles from './AIToggleButton.module.css';
import mascotIcon from '../../assets/AI.json';
import Lottie from 'lottie-react';

const AIToggleButton = () => {
  const { toggleAIMascot } = useAIMascot();

  return (
    <button 
      className={styles.toggleButton} 
      onClick={toggleAIMascot}
      aria-label="Toggle AI Assistant"
    >
      <div className={styles.lottieIcon}>
        <Lottie animationData={mascotIcon} loop={true} />
      </div>
    </button>
  );
};

export default AIToggleButton;
