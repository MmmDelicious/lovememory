import React from 'react';
import PropTypes from 'prop-types';
import styles from './PlayingCard.module.css';

const suitSymbols = {
  'H': '♥',
  'D': '♦',
  'C': '♣',
  'S': '♠',
};

const suitColorClasses = {
  'H': styles.hearts,
  'D': styles.diamonds,
  'C': styles.clubs,
  'S': styles.spades,
};

const PlayingCard = ({ suit, rank, faceUp = true, isWinning = false, isCommunity = false }) => {
  if (!faceUp) {
    return (
      <div className={`${styles.card} ${styles.faceDown}`}>
      </div>
    );
  }

  const colorClass = suitColorClasses[suit];
  const symbol = suitSymbols[suit];

  const displayRank = rank ? (() => {
    switch(rank.toUpperCase()) {
      case 'T': return '10';
      case 'J': return 'J';
      case 'Q': return 'Q';
      case 'K': return 'K';
      case 'A': return 'A';
      default: return rank.toUpperCase();
    }
  })() : '';
  
  const cardClasses = [
    styles.card,
    colorClass,
    isWinning ? styles.winning : '',
    isCommunity ? styles.community : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      <div className={styles.topLeft}>
        <span className={styles.rank}>{displayRank}</span>
        <span className={styles.suit}>{symbol}</span>
      </div>
      <div className={styles.centerSuit}>
        {symbol}
      </div>
      <div className={styles.bottomRight}>
        <span className={styles.rank}>{displayRank}</span>
        <span className={styles.suit}>{symbol}</span>
      </div>
    </div>
  );
};

PlayingCard.propTypes = {
  suit: PropTypes.oneOf(['H', 'D', 'C', 'S']),
  rank: PropTypes.string,
  faceUp: PropTypes.bool,
  isWinning: PropTypes.bool,
  isCommunity: PropTypes.bool,
};

export default PlayingCard; 