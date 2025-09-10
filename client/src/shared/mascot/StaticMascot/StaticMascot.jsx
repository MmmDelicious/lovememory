import React, { useState } from 'react';
import Lottie from 'lottie-react';
import styles from './StaticMascot.module.css';
const StaticMascot = ({ message, animationData, bubbleKey, onAvatarClick, isError = false, mode = 'login' }) => {
  const [isAnnoyed, setIsAnnoyed] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  
  // Тряска при ошибке
  React.useEffect(() => {
    if (isError) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isError]);
  
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
        className={`${styles.avatar} ${isAnnoyed || isShaking ? styles.shaking : ''}`}
        onClick={handleClick}
      >
        <Lottie animationData={animationData} loop={true} />
      </div>
      <div key={bubbleKey} className={`${styles.speechBubble} ${mode === 'register' ? styles.speechBubbleRegister : ''}`}>
        <p>{message}</p>
      </div>
    </div>
  );
};
export default StaticMascot;
