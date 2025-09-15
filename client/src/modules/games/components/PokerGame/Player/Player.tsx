import React from 'react';
import UserAvatar from '../../UserAvatar/UserAvatar';
import { User } from '../../../../modules/auth/store/authSlice';
import PlayingCard from '../../PlayingCard/PlayingCard';
import type { PlayerProps } from '../../../../types/game.types';
import styles from './Player.module.css';
const Player: React.FC<PlayerProps> = ({ 
  player, 
  isMainPlayer = false, 
  showCards = false, 
  isActive = false, 
  isWinner = false, 
  dealingPhase = false, 
  yourHand = [], 
  isWinningCard = () => false,
  hasBoughtIn = false
}) => {
  if (!player) return null;
  const renderPlayerCards = () => {
    if (!isMainPlayer && !player.inHand) return null;
    if (isMainPlayer) {
      return (yourHand && yourHand.length > 0) ? yourHand.map((card, index) => (
        <div
          key={index}
          className={`${styles.cardWrapper} ${dealingPhase ? styles.cardDealing : ''}`}
          style={{ animationDelay: `${index * 0.2}s` }}
        >
          <PlayingCard 
            suit={card.suit} 
            rank={card.rank} 
            faceUp={showCards} 
            isWinning={isWinningCard(card)}
          />
        </div>
      )) : <div className={styles.hiddenCardsPlaceholder} />;
    }
    const playerCards = player.hand || player.cards || [];
    const shouldShowCards = showCards || player.showCards; // Показываем карты если общий флаг или игрок выбрал показать
    return [0, 1].map((index) => {
      const card = playerCards[index];
      return (
        <div
          key={index}
          className={`${styles.cardWrapper} ${dealingPhase ? styles.cardDealing : ''}`}
          style={{ animationDelay: `${index * 0.2 + 0.1}s` }}
        >
          <PlayingCard 
            suit={card?.suit}
            rank={card?.rank}
            faceUp={shouldShowCards && player.inHand} 
            isWinning={shouldShowCards && card ? isWinningCard(card) : false}
          />
        </div>
      );
    });
  };
  return (
    <div className={`${styles.playerContainer} ${isActive ? styles.active : ''} ${isWinner ? styles.winner : ''} ${player?.hasBoughtIn ? styles.hasBoughtIn : styles.waitingBuyIn}`}>
              <UserAvatar 
          user={player as User}
        className={styles.avatar}
        size="medium"
        variant="default"
      />
      <div className={styles.playerInfo}>
        <div className={styles.playerName}>
          {player?.name || 'Игрок'}
        </div>
        <div className={styles.stack}>
          <span className={styles.chipsIcon}>🪙</span>
          {player?.stack || 0}
        </div>
        {!player?.hasBoughtIn && (
          <div className={styles.waitingStatus}>Ожидает buy-in</div>
        )}
      </div>
      <div className={styles.playerCards}>
        {renderPlayerCards()}
      </div>
      {(player?.currentBet || 0) > 0 && (
        <div className={styles.betIndicator}>
          {player.currentBet}
        </div>
      )}
      {!player?.inHand && (player?.stack || 0) > 0 && (
        <div className={styles.foldedIndicator}>Пас</div>
      )}
      {player?.isAllIn && (
        <div className={styles.allInIndicator}>All-in</div>
      )}
    </div>
  );
};
export default Player;
