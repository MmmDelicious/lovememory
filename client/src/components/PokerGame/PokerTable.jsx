import React, { useState, useMemo, useEffect, Fragment } from 'react';
import PropTypes from 'prop-types';
import PlayingCard from '../PlayingCard/PlayingCard';
import Button from '../Button/Button';
import { useCurrency } from '../../context/CurrencyContext';
import styles from './PokerTable.module.css';
import avatarImage from './assets/avatar.png';
import Avatar from '../Avatar/Avatar';

const PokerTable = ({ gameState, onAction, onRebuy, userId }) => {
  if (!gameState) return null;

  const [raiseAmount, setRaiseAmount] = useState(0);
  const [animatingCards, setAnimatingCards] = useState([]);
  const [dealingPhase, setDealingPhase] = useState(false);
  const [prevStage, setPrevStage] = useState(null);
  const [showRebuyModal, setShowRebuyModal] = useState(false);
  const [winnerAnimation, setWinnerAnimation] = useState(null);
  
  const { coins } = useCurrency();

  const { players = [], communityCards = [], pot = 0, currentPlayerId, stage, validActions = [], minRaiseAmount = 0, currentBet = 0, winningHandCards = [] } = gameState || {};

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
    const player = players ? players.find(p => p.id === userId) : null;
    return player ? player.stack : 0;
  }, [players, userId]);

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
    if (gameState && gameState.stage === 'pre-flop' && gameState.yourHand && gameState.yourHand.length > 0) {
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

  if (!gameState || gameState.status === 'waiting' || gameState.stage === 'waiting' || (players && players.length < 2)) {
    return (
      <div className={styles.gameContainer}>
        <div className={styles.pokerTable}>
          <div className={styles.deckContainer}>
            <PlayingCard faceUp={false} />
          </div>
          
          <div className={styles.waitingContainer}>
            <div className={styles.waitingMessage}>
              <div className={styles.waitingIcon}>⏳</div>
              <div className={styles.waitingText}>
                {gameState?.message || 'Ожидание второго игрока...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'waiting_for_next_hand') {
    return (
      <div className={styles.gameContainer}>
        <div className={styles.pokerTable}>
          <div className={styles.deckContainer}>
            <PlayingCard faceUp={false} />
          </div>
          
          <div className={styles.waitingContainer}>
            <div className={styles.waitingMessage}>
              <div className={styles.waitingIcon}>🃏</div>
              <div className={styles.waitingText}>
                {gameState.message || 'Дождитесь завершения текущей раздачи...'}
              </div>
              <div className={styles.waitingSubtext}>
                Вы присоединитесь к игре в следующей раздаче
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.status === 'waiting_for_players') {
    return (
      <div className={styles.gameContainer}>
        <div className={styles.pokerTable}>
          <div className={styles.deckContainer}>
            <PlayingCard faceUp={false} />
          </div>
          
          <div className={styles.waitingContainer}>
            <div className={styles.waitingMessage}>
              <div className={styles.waitingIcon}>👥</div>
              <div className={styles.waitingText}>
                Ожидание других игроков...
              </div>
              <div className={styles.waitingSubtext}>
                Минимум 2 игрока для начала раздачи
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isWinningCard = (card) => {
    if (!winningHandCards || winningHandCards.length === 0) return false;
    return winningHandCards.some(wc => wc.rank === card.rank && wc.suit === card.suit);
  };

  const getAvatarUrl = () => {
    return avatarImage;
  };

  // --- Вспомогательные константы для 5 мест ---
  const SEAT_POSITIONS = [0, 1, 2, 3, 4]; // 0 — ты, 1-4 — остальные по кругу

  // --- Новый getPlayerSeatMap ---
  // Возвращает массив из 5 мест: либо игрок, либо null (если место пустое)
  const getPlayerSeatMap = () => {
    if (!players || players.length === 0) return [null, null, null, null, null];
    // Твой игрок всегда seat 0
    const mainPlayer = players.find(p => p.id === userId);
    const others = players.filter(p => p.id !== userId);
    const seats = [mainPlayer || null];
    for (let i = 0; i < 4; i++) {
      seats.push(others[i] || null);
    }
    return seats;
  };

  // --- Новый renderPlayerArea ---
  const renderPlayerArea = (player, seatIndex) => {
    if (!player) {
      // Пустое место
      return (
        <div key={`empty-seat-${seatIndex}`} className={`${styles.playerPosition} ${styles[`playerPosition${seatIndex}`]} ${styles.emptySeat}`}> 
          <div className={styles.emptyAvatar}> 
            <span role="img" aria-label="empty">🪑</span>
          </div>
          <div className={styles.emptyText}>Свободно</div>
        </div>
      );
    }
    const isMainPlayer = player.id === userId;
    const showCards = (stage === 'showdown') || isMainPlayer || (gameState.status === 'finished');
    const isActive = player.id === currentPlayerId && gameState.status !== 'finished';
    const isWinner = winnerAnimation === player.id;
    return (
      <div key={player.id} className={`${styles.playerPosition} ${styles[`playerPosition${seatIndex}`]} ${isActive ? styles.active : ''} ${isWinner ? styles.winner : ''}`}>
        <Avatar
          src={getAvatarUrl()}
          alt={`${player.name}'s avatar`}
          className={styles.avatar}
          size="medium"
          variant="circle"
        />
        
        <div className={styles.playerInfo}>
          <div className={styles.playerName}>
            {player.name} {player.isDealer && '🎯'}
          </div>
          <div className={styles.playerStats}>
            <span className={styles.stack}>
              <span className={styles.chipsIcon}>🪙</span>
              {isMainPlayer ? gameState.yourStack : player.stack}
            </span>
            {(isMainPlayer ? gameState.yourCurrentBet : player.currentBet) > 0 && (
              <span className={styles.bet}>Ставка: {isMainPlayer ? gameState.yourCurrentBet : player.currentBet}</span>
            )}
            {!player.inHand && <span className={styles.folded}>Пас</span>}
          </div>
        </div>

        <div className={styles.playerCards}>
          {isMainPlayer ? (
            (gameState.yourHand && gameState.yourHand.length > 0) ? (gameState.yourHand || []).map((card, index) => (
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
            )) : null
          ) : (
            [0, 1].map((index) => (
              <div
                key={index}
                className={`${styles.cardWrapper} ${dealingPhase ? styles.cardDealing : ''}`}
                style={{ animationDelay: `${index * 0.2 + 0.1}s` }}
              >
                <PlayingCard 
                  faceUp={showCards} 
                  isWinning={false}
                />
              </div>
            ))
          )}
        </div>
      </div>
    );
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
          <Fragment key={player?.id || `seat-${seatIndex}`}>{renderPlayerArea(player, seatIndex)}</Fragment>
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