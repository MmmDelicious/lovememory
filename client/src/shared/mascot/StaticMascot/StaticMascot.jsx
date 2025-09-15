import React, { useState, useMemo } from 'react';
import Lottie from 'lottie-react';
import styles from './StaticMascot.module.css';
const StaticMascot = ({ message, animationData, bubbleKey, onAvatarClick, isError = false, mode = 'login' }) => {
  const [isAnnoyed, setIsAnnoyed] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  
  // Мемоизируем данные анимации, чтобы избежать пересоздания на каждом рендере
  const memoizedAnimationData = useMemo(() => {
    return JSON.parse(JSON.stringify(animationData));
  }, [animationData]);
  
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
        <Lottie animationData={memoizedAnimationData} loop={true} />
      </div>
      <div key={bubbleKey} className={`${styles.speechBubble} ${mode === 'register' ? styles.speechBubbleRegister : ''}`}>
        <p>{message}</p>
      </div>
    </div>
  );
};

// Мемоизируем компонент для предотвращения лишних перерисовок
export default React.memo(StaticMascot, (prevProps, nextProps) => {
  return (
    prevProps.message === nextProps.message &&
    prevProps.bubbleKey === nextProps.bubbleKey &&
    prevProps.isError === nextProps.isError &&
    prevProps.mode === nextProps.mode &&
    prevProps.animationData === nextProps.animationData &&
    prevProps.onAvatarClick === nextProps.onAvatarClick
  );
});
