import React from 'react';
import styles from './MemoryCard.module.css';
import '../../index.css';

interface MemoryCardProps {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: () => void;
  disabled: boolean;
  className?: string;
}

const MemoryCard: React.FC<MemoryCardProps> = ({
  id,
  value,
  isFlipped,
  isMatched,
  onClick,
  disabled,
  className = ''
}) => {
  const handleClick = () => {
    if (!disabled && !isFlipped && !isMatched) {
      onClick();
    }
  };

  return (
    <div
      className={`${styles.card} ${isFlipped ? styles.flipped : ''} ${isMatched ? styles.matched : ''} ${className ? styles[className] : ''}`}
      onClick={handleClick}
    >
      <div className={styles.cardInner}>
        <div className={styles.cardFront}>
          <div className={styles.cardBackContent}>
            <span className={styles.cardBackSymbol}>?</span>
          </div>
        </div>
        <div className={styles.cardBack}>
          <div className={styles.cardValue}>
            <span className={styles.cardSymbol}>{value}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryCard;
