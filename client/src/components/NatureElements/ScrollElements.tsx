import React, { useEffect, useState } from 'react';
import styles from './ScrollElements.module.css';

const ScrollElements: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const progress = Math.min(scrollY / (document.body.scrollHeight - window.innerHeight), 1);

  return (
    <div className={styles.scrollContainer}>
      {/* Scroll Progress Indicator */}
      <div 
        className={styles.scrollProgress}
        style={{ width: `${progress * 100}%` }}
      />
      
      {/* Simplified Floating Elements */}
      <div 
        className={`${styles.geoShape} ${styles.shape1}`}
        style={{ 
          transform: `translateY(${scrollY * 0.1}px)`,
          opacity: 0.3
        }}
      >
        <div className={styles.circle}></div>
      </div>


      {/* Floating Icons with Scroll Physics */}
      <div 
        className={`${styles.floatingIcon} ${styles.icon1}`}
        style={{ 
          transform: `translateY(${scrollY * 0.4}px) translateX(${Math.sin(scrollY * 0.01) * 30}px) rotate(${scrollY * 0.15}deg)`,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path 
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
            fill="url(#heartGradient)"
          />
          <defs>
            <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop offset="100%" stopColor="var(--color-accent-coral)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      <div 
        className={`${styles.floatingIcon} ${styles.icon2}`}
        style={{ 
          transform: `translateY(${scrollY * -0.3}px) translateX(${Math.cos(scrollY * 0.008) * 25}px) rotate(${scrollY * -0.1}deg)`,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path 
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
            fill="url(#starGradient)"
          />
          <defs>
            <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent-orange)" />
              <stop offset="100%" stopColor="var(--color-accent-emerald)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      <div 
        className={`${styles.floatingIcon} ${styles.icon3}`}
        style={{ 
          transform: `translateY(${scrollY * 0.35}px) translateX(${Math.sin(scrollY * 0.012) * 20}px) scale(${1 + progress * 0.2})`,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="url(#circleGradient)" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="6" fill="url(#circleGradient)" opacity="0.6"/>
          <defs>
            <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-accent-slate)" />
              <stop offset="100%" stopColor="var(--color-accent-emerald)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

    </div>
  );
};

export default ScrollElements;
