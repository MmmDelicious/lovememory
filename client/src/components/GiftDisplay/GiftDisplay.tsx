import React, { useEffect, useState } from 'react';
import { X, Heart } from 'lucide-react';
import LottiePlayer from 'react-lottie-player';
import { useUser } from '../../store/hooks';
import styles from './GiftDisplay.module.css';
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
  const user = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const [animationData, setAnimationData] = useState(null);
  useEffect(() => {
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
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [gift.giftType]);
  const handleClose = async () => {
    setIsVisible(false);
    try {
      await fetch(`/api/gifts/${gift.id}/viewed`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.token}`
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
        {}
        <button className={styles.closeButton} onClick={handleClose}>
          <X size={24} />
        </button>
        {}
        <div className={styles.giftHeader}>
          <Heart className={styles.heartIcon} size={32} />
          <h2 className={styles.giftTitle}>{getGiftTitle(gift.giftType)}</h2>
          <p className={styles.senderName}>От: {gift.senderName}</p>
        </div>
        {}
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
        {}
        {gift.photoPath && (
          <div className={styles.photoContainer}>
            <img 
              src={`/uploads/${gift.photoPath}`} 
              alt="Прикрепленное фото"
              className={styles.giftPhoto}
            />
          </div>
        )}
        {}
        <div className={styles.messageContainer}>
          <div className={styles.messageBox}>
            <p className={styles.messageText}>{gift.message}</p>
          </div>
        </div>
        {}
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

