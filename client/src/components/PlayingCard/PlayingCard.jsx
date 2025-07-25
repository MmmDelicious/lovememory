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
  'H': 'hearts',
  'D': 'diamonds',
  'C': 'clubs',
  'S': 'spades',
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
    colorClass ? styles[colorClass] : '',
    isWinning ? styles.winning : '',
    isCommunity ? styles.community : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      <span className={styles.rank}>{displayRank}</span>
      <span className={`${styles.suit} ${colorClass ? styles[colorClass] : ''}`}>{symbol}</span>
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