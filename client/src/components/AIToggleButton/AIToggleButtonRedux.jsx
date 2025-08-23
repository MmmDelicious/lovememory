import React from 'react';
import { useAppDispatch, useAIMascot } from '../../store/hooks';
import { toggleAIMascot } from '../../store/slices/mascotSlice';
import styles from './AIToggleButton.module.css';
import mascotIcon from '../../assets/AI.json';
import Lottie from 'lottie-react';

const AIToggleButtonRedux = () => {
  const dispatch = useAppDispatch();
  const { isVisible } = useAIMascot();

  const handleToggle = () => {
    dispatch(toggleAIMascot());
  };

  return (
    <button 
      className={`${styles.toggleButton} ${isVisible ? styles.active : ''}`}
      onClick={handleToggle}
      aria-label="Toggle AI Assistant"
    >
      <div className={styles.lottieIcon}>
        <Lottie animationData={mascotIcon} loop={true} />
      </div>
    </button>
  );
};

export default AIToggleButtonRedux;

