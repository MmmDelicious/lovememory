import React, { useEffect, useState } from 'react';
import styles from './ScrollReveal.module.css';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'rotate';
  delay?: number;
  duration?: number;
  className?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({ 
  children, 
  direction = 'up', 
  delay = 0, 
  duration = 0.8,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const element = document.querySelector(`[data-scroll-reveal="${Math.random()}"]`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [delay]);

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up': return 'translateY(60px)';
        case 'down': return 'translateY(-60px)';
        case 'left': return 'translateX(60px)';
        case 'right': return 'translateX(-60px)';
        case 'scale': return 'scale(0.8)';
        case 'rotate': return 'rotate(10deg) scale(0.9)';
        default: return 'translateY(60px)';
      }
    }
    
    // Add subtle parallax effect when visible
    const parallaxOffset = scrollY * 0.02;
    return `translateY(${parallaxOffset}px)`;
  };

  return (
    <div
      data-scroll-reveal={Math.random()}
      className={`${styles.scrollReveal} ${className}`}
      style={{
        transform: getTransform(),
        opacity: isVisible ? 1 : 0,
        transition: `all ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
