import React, { useEffect, useRef } from 'react';
import styles from './RadialMenu.module.css';

const RadialMenu = ({ 
  isOpen, 
  items, 
  onAction, 
  onClose, 
  centerPosition = { x: 50, y: 50 },
  radius = 120,
  itemSize = 60
}) => {
  const menuRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      // Анимация появления
      const menu = menuRef.current;
      menu.style.opacity = '0';
      menu.style.transform = 'scale(0.8)';
      
      requestAnimationFrame(() => {
        menu.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        menu.style.opacity = '1';
        menu.style.transform = 'scale(1)';
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleItemClick = (actionId, e) => {
    e.stopPropagation();
    onAction(actionId);
    onClose();
  };

  const handleOverlayClick = (e) => {
    // Закрываем меню при клике на overlay
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleContainerClick = (e) => {
    // Предотвращаем закрытие при клике на контейнер меню
    e.stopPropagation();
  };

  const sliceCount = items.length;
  const sliceAngle = 360 / sliceCount;

  return (
    <div 
      ref={overlayRef}
      className={styles.radialMenuOverlay} 
      onClick={handleOverlayClick}
    >
      <div 
        ref={menuRef}
        className={styles.radialMenuContainer}
        style={{
          left: `${centerPosition.x}%`,
          top: `${centerPosition.y}%`,
          '--radius': `${radius}px`,
          '--item-size': `${itemSize}px`
        }}
        onClick={handleContainerClick}
      >
        {/* Радиальные элементы */}
        {items.map((item, index) => {
          const itemAngle = sliceAngle * index - 90;
          const delay = index * 0.08;
          
          return (
            <div
              key={item.id}
              className={styles.menuItem}
              style={{
                '--angle': `${itemAngle}deg`,
                '--delay': `${delay}s`,
                '--index': index
              }}
              onClick={(e) => handleItemClick(item.id, e)}
              title={item.label}
            >
              <div className={styles.menuItemContent}>
                <div className={styles.menuItemIcon}>
                  {item.icon}
                </div>
                <div className={styles.menuItemLabel}>
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RadialMenu;