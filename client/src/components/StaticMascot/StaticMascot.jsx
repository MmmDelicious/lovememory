import React, { useState } from 'react';
import Lottie from 'lottie-react';
import styles from './StaticMascot.module.css';
const StaticMascot = ({ message, animationData, bubbleKey, onAvatarClick }) => {
  const [isAnnoyed, setIsAnnoyed] = useState(false);
  const handleClick = () => {
    if (isAnnoyed) return;
    if (onAvatarClick) {
      onAvatarClick();
    }
    setIsAnnoyed(true);
    setTimeout(() => setIsAnnoyed(false), 500);
  };
  return (
    <div className={styles.wrapper}>
      <div 
        className={`${styles.avatar} ${isAnnoyed ? styles.shaking : ''}`}
        onClick={handleClick}
      >
        <Lottie animationData={animationData} loop={true} />
      </div>
      <div key={bubbleKey} className={styles.speechBubble}>
        <p>{message}</p>
      </div>
    </div>
  );
};
export default StaticMascot;
