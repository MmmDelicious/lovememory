import React from 'react';
import styles from './ContextMenu.module.css';

const ContextMenu = ({ 
  isVisible, 
  position, 
  onClose, 
  onAction,
  mascotDirection 
}) => {
  if (!isVisible) return null;

  const menuItems = [
    {
      id: 'chat',
      label: '💬 Поговорить',
      description: 'Открыть чат с ИИ'
    },
    {
      id: 'joke',
      label: '😄 Рассказать шутку',
      description: 'Послушать что-нибудь смешное'
    },
    {
      id: 'dance',
      label: '💃 Потанцевать',
      description: 'Устроить небольшое шоу'
    },
    {
      id: 'advice',
      label: '💡 Дать совет',
      description: 'Получить мудрый совет'
    },
    {
      id: 'weather',
      label: '🌤️ Погода',
      description: 'Узнать прогноз погоды'
    },
    {
      id: 'mood',
      label: '😊 Поднять настроение',
      description: 'Получить заряд позитива'
    },
    {
      id: 'hide',
      label: '👋 Спрятаться',
      description: 'Временно исчезнуть'
    }
  ];

  const handleItemClick = (itemId) => {
    onAction(itemId);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Определяем позицию меню в зависимости от направления маскота
  const getMenuPosition = () => {
    const baseX = position.x;
    const baseY = position.y;
    
    // Если маскот смотрит влево, меню появляется справа от него
    // Если маскот смотрит вправо, меню появляется слева от него
    const offsetX = mascotDirection === 'left' ? 20 : -20;
    
    return {
      left: `${baseX + offsetX}%`,
      top: `${baseY}%`,
      transform: 'translate(-50%, -50%)'
    };
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div 
        className={styles.contextMenu}
        style={getMenuPosition()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.menuHeader}>
          <span className={styles.menuTitle}>Что делаем? 😊</span>
        </div>
        <div className={styles.menuItems}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={styles.menuItem}
              onClick={() => handleItemClick(item.id)}
            >
              <div className={styles.itemLabel}>{item.label}</div>
              <div className={styles.itemDescription}>{item.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContextMenu; 