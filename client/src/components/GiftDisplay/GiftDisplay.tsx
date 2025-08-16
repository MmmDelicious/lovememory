import React, { useEffect, useState } from 'react';
import { X, Heart } from 'lucide-react';
import LottiePlayer from 'react-lottie-player';
import { useAuth } from '../../context/AuthContext';
import styles from './GiftDisplay.module.css';

// Import animations
import guitarAnimation from '../../assets/guitar.json';
import runningCharacterAnimation from '../../assets/running-character.json';

interface GiftDisplayProps {
  gift: {
    id: string;
    giftType: string;
    message: string;
    photoPath?: string;
    senderName: string;
    createdAt: string;
  };
  onClose: () => void;
}

const GiftDisplay: React.FC<GiftDisplayProps> = ({ gift, onClose }) => {
  const { token } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Load animation based on gift type
    switch (gift.giftType) {
      case 'guitar':
        setAnimationData(guitarAnimation);
        break;
      case 'running-character':
        setAnimationData(runningCharacterAnimation);
        break;
      default:
        setAnimationData(null);
    }

    // Show with animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [gift.giftType]);

  const handleClose = async () => {
    setIsVisible(false);
    
    // Mark as viewed
    try {
      await fetch(`/api/gifts/${gift.id}/viewed`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error marking gift as viewed:', error);
    }
    
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getGiftTitle = (giftType: string): string => {
    switch (giftType) {
      case 'guitar':
        return 'Музыкальный подарок';
      case 'running-character':
        return 'Энергичный сюрприз';
      default:
        return 'Подарок';
    }
  };

  return (
    <div className={`${styles.overlay} ${isVisible ? styles.visible : ''}`}>
      <div className={`${styles.giftContainer} ${isVisible ? styles.animateIn : ''}`}>
        {/* Close Button */}
        <button className={styles.closeButton} onClick={handleClose}>
          <X size={24} />
        </button>

        {/* Gift Header */}
        <div className={styles.giftHeader}>
          <Heart className={styles.heartIcon} size={32} />
          <h2 className={styles.giftTitle}>{getGiftTitle(gift.giftType)}</h2>
          <p className={styles.senderName}>От: {gift.senderName}</p>
        </div>

        {/* Animation */}
        {animationData && (
          <div className={styles.animationContainer}>
            <LottiePlayer
              animationData={animationData}
              play
              loop
              style={{ width: '200px', height: '200px' }}
            />
          </div>
        )}

        {/* Photo */}
        {gift.photoPath && (
          <div className={styles.photoContainer}>
            <img 
              src={`/uploads/${gift.photoPath}`} 
              alt="Прикрепленное фото"
              className={styles.giftPhoto}
            />
          </div>
        )}

        {/* Message */}
        <div className={styles.messageContainer}>
          <div className={styles.messageBox}>
            <p className={styles.messageText}>{gift.message}</p>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.giftFooter}>
          <button className={styles.thankYouButton} onClick={handleClose}>
            💖 Спасибо!
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiftDisplay;
