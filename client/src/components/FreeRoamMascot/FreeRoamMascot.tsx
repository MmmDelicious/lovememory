import React, { useState, useCallback } from 'react';
import Lottie from 'lottie-react';
import RadialMenu from '../RadialMenu/RadialMenu';
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
  onContextMenuAction?: (actionId: string) => void;
}

const FreeRoamMascot: React.FC<FreeRoamMascotProps> = ({ 
  state, 
  animationData, 
  onClick, 
  isAILoading, 
  onContextMenuAction 
}) => {
  const { position, message, direction } = state;
  const [isRadialMenuOpen, setIsRadialMenuOpen] = useState(false);

  const wrapperClasses = [
    styles.mascotWrapper,
    direction === 'right' ? styles.flipped : ''
  ].join(' ');

  const displayMessage = isAILoading ? "Думаю..." : message;

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRadialMenuOpen(prev => !prev);
  }, []);

  const handleLeftClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  const handleRadialMenuAction = useCallback((actionId: string) => {
    if (onContextMenuAction) {
      onContextMenuAction(actionId);
    }
  }, [onContextMenuAction]);

  const handleRadialMenuClose = useCallback(() => {
    setIsRadialMenuOpen(false);
  }, []);

  // Конфигурация элементов радиального меню
  const radialMenuItems = [
    { id: 'chat', label: 'Чат', icon: '💬' },
    { id: 'joke', label: 'Шутка', icon: '😂' },
    { id: 'generateDate', label: 'Свидание', icon: '💕' },
    { id: 'dance', label: 'Танец', icon: '💃' },
    { id: 'advice', label: 'Совет', icon: '💡' },
    { id: 'mood', label: 'Настроение', icon: '😊' },
    { id: 'hide', label: 'Скрыть', icon: '🙈' }
  ];

  return (
    <div
      className={styles.mascotContainer}
      style={{
        top: `${position.y}%`,
        left: `${position.x}%`,
      }}
      onClick={handleLeftClick}
      onContextMenu={handleRightClick}
    >
      {displayMessage && (
        <div className={styles.speechBubble}>
          {displayMessage}
        </div>
      )}
      <div className={wrapperClasses}>
        <Lottie animationData={animationData} loop={true} />
      </div>

      {/* Радиальное меню внутри контейнера маскота */}
      <RadialMenu
        isOpen={isRadialMenuOpen}
        items={radialMenuItems}
        onAction={handleRadialMenuAction}
        onClose={handleRadialMenuClose}
        centerPosition={{ x: 50, y: 50 }} // Относительно контейнера маскота
        radius={140}
        itemSize={65}
      />
    </div>
  );
};

export default FreeRoamMascot;
