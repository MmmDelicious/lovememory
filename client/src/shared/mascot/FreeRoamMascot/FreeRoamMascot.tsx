import React, { useState, useCallback } from 'react';
import Lottie from 'lottie-react';
import styles from './FreeRoamMascot.module.css';
interface MascotState {
  position: { x: number; y: number };
  message: string;
  direction: 'left' | 'right';
}
interface FreeRoamMascotProps {
  state: MascotState;
  animationData: any;
  onClick?: () => void;
  isAILoading?: boolean;
}
const FreeRoamMascot: React.FC<FreeRoamMascotProps> = ({ 
  state, 
  animationData, 
  onClick, 
  isAILoading
}) => {
  const { position, message, direction } = state;
  const wrapperClasses = [
    styles.mascotWrapper,
    direction === 'right' ? styles.flipped : ''
  ].join(' ');
  const displayMessage = isAILoading ? "Думаю..." : message;
  const handleLeftClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  }, [onClick]);
  return (
    <div
      className={styles.mascotContainer}
      style={{
        top: `${position.y}%`,
        left: `${position.x}%`,
      }}
      onClick={handleLeftClick}
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

