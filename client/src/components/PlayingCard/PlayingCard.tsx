import React from 'react';
import type { PlayingCardProps } from '../../../types/game.types';
import styles from './PlayingCard.module.css';

const suitSymbols: Record<string, string> = {
  'H': '♥',
  'D': '♦',
  'C': '♣',
  'S': '♠',
};

const suitColorClasses: Record<string, string> = {
  'H': 'hearts',
  'D': 'diamonds',
  'C': 'clubs',
  'S': 'spades',
};

const PlayingCard: React.FC<PlayingCardProps> = ({ 
  suit, 
  rank, 
  faceUp = true, 
  isWinning = false, 
  isCommunity = false 
}) => {
  if (!faceUp) {
    return (
      <div className={`${styles.card} ${styles.faceDown}`}>
        <div className={styles.cardBack}>
          <div className={styles.cardPattern}></div>
        </div>
      </div>
    );
  }

  if (!suit || !rank) {
    return (
      <div className={`${styles.card} ${styles.empty}`}>
        <div className={styles.emptySlot}>?</div>
      </div>
    );
  }

  const colorClass = suitColorClasses[suit];
  const symbol = suitSymbols[suit];

  const displayRank = (() => {
    switch(rank.toUpperCase()) {
      case 'T': return '10';
      case 'J': return 'J';
      case 'Q': return 'Q';
      case 'K': return 'K';
      case 'A': return 'A';
      default: return rank.toUpperCase();
    }
  })();
  
  const cardClasses = [
    styles.card,
    styles.faceUp,
    colorClass ? styles[colorClass] : '',
    isWinning ? styles.winning : '',
    isCommunity ? styles.community : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      <div className={styles.cardContent}>
        <div className={styles.topLeft}>
          <span className={styles.rank}>{displayRank}</span>
          <span className={`${styles.suit} ${colorClass ? styles[colorClass] : ''}`}>
            {symbol}
          </span>
        </div>
        
        <div className={styles.center}>
          <span className={`${styles.centerSuit} ${colorClass ? styles[colorClass] : ''}`}>
            {symbol}
          </span>
        </div>
        
        <div className={styles.bottomRight}>
          <span className={`${styles.rank} ${styles.rotated}`}>{displayRank}</span>
          <span className={`${styles.suit} ${styles.rotated} ${colorClass ? styles[colorClass] : ''}`}>
            {symbol}
          </span>
        </div>
      </div>
      
      {isWinning && (
        <div className={styles.winningGlow}></div>
      )}
    </div>
  );
};

export default PlayingCard;