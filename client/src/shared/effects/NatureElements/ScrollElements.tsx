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
      

      {/* New floating decorative images */}
      <div 
        className={`${styles.floatingIcon} ${styles.icon4}`}
        style={{ 
          transform: `translateY(${scrollY * 0.25}px) translateX(${Math.sin(scrollY * 0.015) * 40}px)`,
        }}
      >
        <img 
          src="/src/assets/pictures/single-3d-heart--glossy--pastel-pink--soft-shadows.png" 
          alt="" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      <div 
        className={`${styles.floatingIcon} ${styles.icon5}`}
        style={{ 
          transform: `translateY(${scrollY * -0.2}px) translateX(${Math.cos(scrollY * 0.01) * 30}px)`,
        }}
      >
        <img 
          src="/src/assets/pictures/small-5-petal-flower--vector-style--pastel-pink--i.png" 
          alt="" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      <div 
        className={`${styles.floatingIcon} ${styles.icon6}`}
        style={{ 
          transform: `translateY(${scrollY * 0.18}px) translateX(${Math.sin(scrollY * 0.009) * 35}px) scale(${1 - progress * 0.1})`,
        }}
      >
        <img 
          src="/src/assets/pictures/single-tiny-pixelated-heart--pastel-red--isolated-.png" 
          alt="" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      <div 
        className={`${styles.floatingIcon} ${styles.icon7}`}
        style={{ 
          transform: `translateY(${scrollY * -0.15}px) translateX(${Math.cos(scrollY * 0.007) * 25}px)`,
        }}
      >
        <img 
          src="/src/assets/pictures/thin-pastel-lavender-glowing-ring--3d-style--isola.png" 
          alt="" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

    </div>
  );
};

export default ScrollElements;
