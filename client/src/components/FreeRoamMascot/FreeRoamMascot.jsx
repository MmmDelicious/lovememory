import React from 'react';
import Lottie from 'lottie-react';
import styles from './FreeRoamMascot.module.css';

const FreeRoamMascot = ({ state, animationData, onClick }) => {
  const { position, message, direction } = state;

  const wrapperClasses = [
    styles.mascotWrapper,
    direction === 'right' ? styles.flipped : ''
  ].join(' ');

  return (
    <div
      className={styles.mascotContainer}
      style={{
        top: `${position.y}%`,
        left: `${position.x}%`,
      }}
      onClick={onClick}
    >
      {message && (
        <div className={styles.speechBubble}>
          {message}
        </div>
      )}
      <div className={wrapperClasses}>
        <Lottie animationData={animationData} loop={true} />
      </div>
    </div>
  );
};

export default FreeRoamMascot;