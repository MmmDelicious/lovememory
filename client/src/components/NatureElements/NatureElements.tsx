import React from 'react';
import styles from './NatureElements.module.css';

const NatureElements: React.FC = () => {
  return (
    <div className={styles.natureContainer}>
      {/* Floating Leaves */}
      <svg className="nature-element nature-leaf nature-leaf--1" viewBox="0 0 24 24" fill="none">
        <path 
          d="M21 12C21 7.03 17.39 3 12.5 3S4 7.03 4 12c0 2.4.94 4.58 2.47 6.19l6.03-6.03L18.53 18.19C20.06 16.58 21 14.4 21 12z" 
          fill="var(--color-accent-sage)"
          opacity="0.6"
        />
        <path 
          d="m12.5 3 6 15.5-6-3.5L6.5 18.5 12.5 3z" 
          fill="var(--color-accent-forest)"
          opacity="0.4"
        />
      </svg>

      <svg className="nature-element nature-leaf nature-leaf--2" viewBox="0 0 24 24" fill="none">
        <path 
          d="M21 12C21 7.03 17.39 3 12.5 3S4 7.03 4 12c0 2.4.94 4.58 2.47 6.19l6.03-6.03L18.53 18.19C20.06 16.58 21 14.4 21 12z" 
          fill="var(--color-accent-sage)"
          opacity="0.5"
        />
      </svg>

      <svg className="nature-element nature-leaf nature-leaf--3" viewBox="0 0 24 24" fill="none">
        <path 
          d="M21 12C21 7.03 17.39 3 12.5 3S4 7.03 4 12c0 2.4.94 4.58 2.47 6.19l6.03-6.03L18.53 18.19C20.06 16.58 21 14.4 21 12z" 
          fill="var(--color-accent-forest)"
          opacity="0.7"
        />
      </svg>

      {/* Floating Petals */}
      <svg className="nature-element nature-petal nature-petal--1" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" fill="var(--color-accent-dusty)" opacity="0.5"/>
        <circle cx="8" cy="8" r="3" fill="var(--color-accent-terracotta)" opacity="0.7"/>
      </svg>

      <svg className="nature-element nature-petal nature-petal--2" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" fill="var(--color-accent-dusty)" opacity="0.4"/>
        <circle cx="8" cy="8" r="3" fill="var(--color-accent-sage)" opacity="0.6"/>
      </svg>

      {/* Scroll-triggered Branch */}
      <svg className={styles.branch} viewBox="0 0 200 100" fill="none">
        <path 
          d="M20 80 Q60 60 100 50 Q140 40 180 20" 
          stroke="var(--color-primary)" 
          strokeWidth="2" 
          fill="none"
          opacity="0.3"
        />
        <path 
          d="M50 65 Q55 60 60 55 M75 45 Q80 40 85 35 M120 35 Q125 30 130 25 M155 25 Q160 20 165 15" 
          stroke="var(--color-accent-sage)" 
          strokeWidth="1.5" 
          fill="none"
          opacity="0.5"
        />
      </svg>
    </div>
  );
};

export default NatureElements;
