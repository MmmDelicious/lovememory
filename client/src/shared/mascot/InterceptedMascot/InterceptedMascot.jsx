import React from 'react';
import Lottie from 'lottie-react';
import styles from './InterceptedMascot.module.css';
const InterceptedMascot = ({ animationData, position }) => {
  return (
    <div
      className={styles.interceptedContainer}
      style={{
        top: `${position.y}%`,
        left: `${position.x}%`,
      }}
    >
      <div className={styles.kickedMascot}>
        <Lottie animationData={animationData} loop={true} />
      </div>
    </div>
  );
};
export default InterceptedMascot;
