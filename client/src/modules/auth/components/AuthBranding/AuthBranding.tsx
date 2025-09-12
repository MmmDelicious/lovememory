import React from 'react';
import styles from './AuthBranding.module.css';

/**
 * Компонент брендинга для страницы авторизации
 * Простой компонент представления без бизнес-логики
 */
export const AuthBranding: React.FC = () => {
  return (
    <div className={styles.brandingPanel}>
      <div className={styles.brandingContent}>
        {/* 3D Сердце */}
        <div className={styles.heart3D}>
          <div className={styles.heartGlow}></div>
        </div>
        
        <h1 className={styles.brandingTitle}>
          LoveMemory <span className={styles.heartIcon}>💕</span>
        </h1>
        <p className={styles.brandingText}>
          Все самые важные моменты вашей истории в одном месте.
        </p>
      </div>
    </div>
  );
};
