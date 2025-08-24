import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Brain, TrendingUp, Heart, Sparkles, X } from 'lucide-react';
import styles from './AnalyticsMascot.module.css';
import aiAnimationData from '../../assets/AI.json';

interface AnalyticsMascotProps {
  isPremium: boolean;
  onFirstLogin?: boolean;
  onDismiss?: () => void;
  userName?: string;
}

const AnalyticsMascot: React.FC<AnalyticsMascotProps> = ({ 
  isPremium, 
  onFirstLogin = false, 
  onDismiss,
  userName = 'Пользователь'
}) => {
  const [showWelcome, setShowWelcome] = useState(onFirstLogin);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(isPremium);

  const welcomeMessages = [
    {
      text: `Привет, ${userName}! 🎉 Я ваш персональный аналитик!`,
      icon: <Sparkles className={styles.messageIcon} />,
      duration: 4000
    },
    {
      text: "В вашу пару теперь встроена умная аналитическая AI модель, которая изучает ваши отношения 24/7",
      icon: <Brain className={styles.messageIcon} />,
      duration: 5000
    },
    {
      text: "Я буду анализировать ваше общение, совместные активности и предлагать персональные рекомендации",
      icon: <TrendingUp className={styles.messageIcon} />,
      duration: 5000
    },
    {
      text: "Моя цель - помочь вам строить более крепкие и счастливые отношения! ❤️",
      icon: <Heart className={styles.messageIcon} />,
      duration: 4000
    }
  ];

  const regularMessages = [
    "Посмотрите на ваш график гармонии! 📈",
    "У вас отличные показатели совместимости! 💖",
    "Рекомендую больше времени проводить вместе 🌟",
    "Ваши языки любви прекрасно дополняют друг друга! 💕"
  ];

  useEffect(() => {
    if (!showWelcome || !isVisible) return;

    const timer = setTimeout(() => {
      if (currentMessageIndex < welcomeMessages.length - 1) {
        setCurrentMessageIndex(prev => prev + 1);
      } else {
        // Закончили показ приветственных сообщений
        setTimeout(() => {
          setShowWelcome(false);
          if (onDismiss) onDismiss();
        }, 2000);
      }
    }, welcomeMessages[currentMessageIndex].duration);

    return () => clearTimeout(timer);
  }, [currentMessageIndex, showWelcome, isVisible, welcomeMessages, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!isPremium || !isVisible) return null;

  const currentMessage = showWelcome 
    ? welcomeMessages[currentMessageIndex]
    : { 
        text: regularMessages[Math.floor(Math.random() * regularMessages.length)],
        icon: <Brain className={styles.messageIcon} />,
        duration: 3000
      };

  return (
    <div className={styles.mascotContainer}>
      <div className={styles.mascotWrapper}>
        <div className={styles.lottieContainer}>
          <Lottie 
            animationData={aiAnimationData} 
            loop={true}
            className={styles.lottieAnimation}
          />
          <div className={styles.premiumBadge}>
            <Sparkles size={12} />
            AI
          </div>
        </div>
        
        <div className={`${styles.speechBubble} ${showWelcome ? styles.welcomeBubble : styles.regularBubble}`}>
          <button className={styles.closeButton} onClick={handleDismiss}>
            <X size={14} />
          </button>
          
          <div className={styles.messageHeader}>
            {currentMessage.icon}
            <span className={styles.mascotTitle}>Ваш AI Аналитик</span>
          </div>
          
          <p className={styles.messageText}>
            {currentMessage.text}
          </p>
          
          {showWelcome && (
            <div className={styles.progressDots}>
              {welcomeMessages.map((_, index) => (
                <div 
                  key={index}
                  className={`${styles.dot} ${index === currentMessageIndex ? styles.activeDot : ''} ${index < currentMessageIndex ? styles.completedDot : ''}`}
                />
              ))}
            </div>
          )}
          
          <div className={styles.bubbleTail} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsMascot;
