import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import PlayingCard from '../PlayingCard/PlayingCard';
import Button from '../Button/Button';
import { useCurrency } from '../../context/CurrencyContext';
import styles from './PokerTable.module.css';
import WaitingDisplay from './WaitingDisplay/WaitingDisplay';
import Player from './Player/Player';

const PokerTable = ({ gameState, onAction, onRebuy, userId }) => {
  if (!gameState) return null;

  const [raiseAmount, setRaiseAmount] = useState(0);
  const [animatingCards, setAnimatingCards] = useState([]);
  const [dealingPhase, setDealingPhase] = useState(false);
  const [prevStage, setPrevStage] = useState(null);
  const [showRebuyModal, setShowRebuyModal] = useState(false);
  const [winnerAnimation, setWinnerAnimation] = useState(null);
  
  const { coins } = useCurrency();

  const { players = [], communityCards = [], pot = 0, currentPlayerId, stage, validActions = [], minRaiseAmount = 0, winningHandCards = [], yourHand = [] } = gameState || {};

  const currentPlayer = useMemo(() => 
    players ? players.find(p => p.id === userId) : null, 
    [players, userId]
  );
  
  const maxBet = useMemo(() => 
    players && players.length > 0 ? Math.max(...players.map(p => p.currentBet)) : 0, 
    [players]
  );
  
  const callAmount = useMemo(() => 
    currentPlayer ? Math.min(maxBet - currentPlayer.currentBet, currentPlayer.stack) : 0, 
    [currentPlayer, maxBet]
  );

  const mainPlayerStack = useMemo(() => {
    return currentPlayer ? currentPlayer.stack : 0;
  }, [currentPlayer]);

  const minRaise = minRaiseAmount || 0;
  const maxRaise = mainPlayerStack;
  const isPlayerTurn = currentPlayerId === userId;

  useEffect(() => {
    if (prevStage !== stage) {
      setPrevStage(stage);
      
      if (stage === 'pre-flop' && prevStage === null) {
        setDealingPhase(true);
        setTimeout(() => setDealingPhase(false), 2000);
      }
      
      if ((stage === 'flop' && prevStage === 'pre-flop') ||
          (stage === 'turn' && prevStage === 'flop') ||
          (stage === 'river' && prevStage === 'turn')) {
        
        const newCards = [];
        if (stage === 'flop') {
          newCards.push(0, 1, 2);
        } else if (stage === 'turn') {
          newCards.push(3);
        } else if (stage === 'river') {
          newCards.push(4);
        }
        
        setAnimatingCards(newCards);
        setTimeout(() => setAnimatingCards([]), 800);
      }
    }
  }, [stage, prevStage]);

  useEffect(() => {
    if (gameState && gameState.stage === 'pre-flop' && yourHand && yourHand.length > 0) {
      setDealingPhase(true);
      setTimeout(() => setDealingPhase(false), 2000);
    }
  }, [gameState?.yourHand]);

  useEffect(() => {
    if (gameState && gameState.status === 'finished' && gameState.winner) {
      const winnerId = typeof gameState.winner === 'object' ? gameState.winner.id : gameState.winner;
      setWinnerAnimation(winnerId);
      setTimeout(() => setWinnerAnimation(null), 3000);
    }
  }, [gameState?.status, gameState?.winner]);

  useEffect(() => {
    setRaiseAmount(minRaise);
  }, [minRaise]);

  const isWaiting = gameState.status !== 'in_progress';
  
  if (isWaiting) {
    return (
      <div className={styles.gameContainer}>
        <div className={styles.pokerTable}>
          <div className={styles.deckContainer}>
            <PlayingCard faceUp={false} />
          </div>
          <WaitingDisplay 
            status={gameState.status} 
            message={gameState.message} 
            playerCount={players.length} 
          />
        </div>
      </div>
    );
  }

  const isWinningCard = (card) => {
    if (!card || !winningHandCards || winningHandCards.length === 0) return false;
    return winningHandCards.some(wc => wc.rank === card.rank && wc.suit === card.suit);
  };
  
  const getPlayerSeatMap = () => {
    if (!players || players.length === 0) return Array(5).fill(null);
    const mainPlayer = players.find(p => p.id === userId);
    const others = players.filter(p => p.id !== userId);
    const seats = [mainPlayer || null];
    for (let i = 0; i < 4; i++) {
      seats.push(others[i] || null);
    }
    return seats;
  };

  const handleRaiseChange = (e) => {
    setRaiseAmount(Number(e.target.value));
  };

  const handleRebuyClick = () => {
    onRebuy();
    setShowRebuyModal(false);
  };
  
  return (
    <div className={styles.gameContainer}>
      <div className={styles.pokerTable}>
        <div className={styles.deckContainer}>
          <PlayingCard faceUp={false} />
        </div>
        
        <div className={styles.stageContainer}>
          <div className={styles.stage}>
            {stage === 'pre-flop' && 'Пре-флоп'}
            {stage === 'flop' && 'Флоп'}
            {stage === 'turn' && 'Тёрн'}
            {stage === 'river' && 'Ривер'}
            {stage === 'showdown' && 'Вскрытие'}
          </div>
        </div>

        <div className={styles.communityCards}>
          {(communityCards || []).map((card, index) => (
            <div
              key={index}
              className={`${styles.communityCardWrapper} ${
                animatingCards.includes(index) ? styles.cardSlideIn : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PlayingCard 
                suit={card.suit} 
                rank={card.rank} 
                faceUp={true} 
                isWinning={isWinningCard(card)}
                isCommunity={true}
              />
            </div>
          ))}
        </div>

        <div className={`${styles.bettingArea} ${winnerAnimation ? styles.chipFlying : ''}`}>
          <button className={styles.betButton}>BET</button>
          <div className={styles.betAmount}>{pot || 0}</div>
        </div>

        <div className={styles.chipStack}>
          <div className={`${styles.chip} ${styles.red}`}></div>
          <div className={`${styles.chip} ${styles.blue}`}></div>
          <div className={`${styles.chip} ${styles.green}`}></div>
        </div>
        
        {getPlayerSeatMap().map((player, seatIndex) => (
          <div key={player?.id || `seat-${seatIndex}`} className={`${styles.playerPosition} ${styles[`playerPosition${seatIndex}`]}`}>
            {player ? (
              <Player 
                player={player}
                isMainPlayer={player.id === userId}
                showCards={stage === 'showdown' || player.id === userId || gameState.status === 'finished'}
                isActive={player.id === currentPlayerId && gameState.status !== 'finished'}
                isWinner={winnerAnimation === player.id}
                dealingPhase={dealingPhase}
                yourHand={yourHand}
                isWinningCard={isWinningCard}
              />
            ) : (
              <div className={styles.emptySeat}> 
                <div className={styles.emptyAvatar}> 
                  <span role="img" aria-label="empty">🪑</span>
                </div>
                <div className={styles.emptyText}>Свободно</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.decorations}>
        <div className={`${styles.decoHeart} ${styles.heart1}`}></div>
        <div className={`${styles.decoHeart} ${styles.heart2}`}></div>
        <div className={`${styles.decoHeart} ${styles.heart3}`}></div>
        <div className={`${styles.decoHeart} ${styles.heart4}`}></div>
        <div className={`${styles.decoHeart} ${styles.heart5}`}></div>
        <div className={`${styles.decoHeart} ${styles.heart6}`}></div>
        <div className={styles.rose}>🌹</div>
      </div>

      <div className={styles.likesCounter}>
        <span className={styles.heartIcon}>♡</span>
        <span className={styles.count}>10</span>
      </div>

      <div className={styles.balanceDisplay}>
        <div className={styles.balanceItem}>
          <span className={styles.balanceIcon}>🪙</span>
          <span className={styles.balanceAmount}>{coins}</span>
          <span className={styles.balanceLabel}>Монеты</span>
        </div>
        <div className={styles.balanceItem}>
          <span className={styles.balanceIcon}>🎰</span>
          <span className={styles.balanceAmount}>{mainPlayerStack}</span>
          <span className={styles.balanceLabel}>Фишки</span>
        </div>
        {currentPlayer && currentPlayer.stack < 200 && (
          <Button 
            onClick={() => setShowRebuyModal(true)}
            variant="secondary"
            className={styles.rebuyButton}
          >
            Докупить фишки
          </Button>
        )}
      </div>

      {showRebuyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.rebuyModal}>
            <h3 className={styles.modalTitle}>Докупка фишек</h3>
            <p className={styles.modalText}>
              Вы можете докупить фишки до начального стека.
              Это действие необратимо для текущей раздачи.
            </p>
            <div className={styles.modalActions}>
              <Button onClick={() => setShowRebuyModal(false)} variant="secondary">
                Отмена
              </Button>
              <Button 
                onClick={handleRebuyClick}
                variant="primary"
                disabled={coins < 100}
              >
                Докупить
              </Button>
            </div>
          </div>
        </div>
      )}

      {isPlayerTurn && gameState && gameState.status !== 'finished' && (
        <div className={styles.actions}>
          {(validActions || []).includes('fold') && <Button onClick={() => onAction('fold')}>Сбросить</Button>}
          {(validActions || []).includes('check') && <Button onClick={() => onAction('check')}>Чек</Button>}
          {(validActions || []).includes('call') && <Button onClick={() => onAction('call')}>Уравнять {callAmount > 0 ? ` (${callAmount})` : ''}</Button>}
          
          {(validActions || []).includes('raise') && (
            <div className={styles.raiseContainer}>
              <Button onClick={() => onAction('raise', raiseAmount)} variant="primary">
                Рейз {raiseAmount}
              </Button>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                Мин: {minRaise} | Макс: {maxRaise}
              </div>
              <input 
                type="range"
                min={minRaise}
                max={maxRaise}
                value={raiseAmount}
                onChange={handleRaiseChange}
                className={styles.raiseSlider}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

PokerTable.propTypes = {
  gameState: PropTypes.object,
  onAction: PropTypes.func.isRequired,
  onRebuy: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
};

export default PokerTable;