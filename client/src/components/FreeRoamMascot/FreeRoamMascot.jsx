import React from 'react';
import Lottie from 'lottie-react';
import styles from './FreeRoamMascot.module.css';

const FreeRoamMascot = ({ state, animationData, onClick, isAILoading }) => {
  const { position, message, direction } = state;

  const wrapperClasses = [
    styles.mascotWrapper,
    direction === 'right' ? styles.flipped : ''
  ].join(' ');

  const displayMessage = isAILoading ? "Думаю..." : message;

  return (
    <div
      className={styles.mascotContainer}
      style={{
        top: `${position.y}%`,
        left: `${position.x}%`,
      }}
      onClick={onClick}
    >
      {displayMessage && (
        <div className={styles.speechBubble}>
          {displayMessage}
        </div>
      )}
      <div className={wrapperClasses}>
        <Lottie animationData={animationData} loop={true} />
      </div>
    </div>
  );
};

export default FreeRoamMascot;