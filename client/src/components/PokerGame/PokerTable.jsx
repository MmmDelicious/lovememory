import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import PlayingCard from '../PlayingCard/PlayingCard';
import Button from '../Button/Button';
import { useCurrency } from '../../context/CurrencyContext';
import styles from './PokerTable.module.css';
import Player from './Player/Player';

const PokerTable = ({ gameState, onAction, onRebuy, userId }) => {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [animatingCards, setAnimatingCards] = useState([]);
  const [dealingPhase, setDealingPhase] = useState(false);
  const [prevStage, setPrevStage] = useState(null);
  const [showRebuyModal, setShowRebuyModal] = useState(false);
  const [winnerAnimation, setWinnerAnimation] = useState(null);
  const [turnTimer, setTurnTimer] = useState(30);
  
  const { coins } = useCurrency();

  const { 
    players = [], 
    communityCards = [], 
    pot = 0, 
    currentPlayerId, 
    stage, 
    validActions = [], 
    minRaiseAmount = 0, 
    maxRaiseAmount = 0,
    callAmount = 0,
    winningHandCards = [], 
    yourHand = [],
    status = 'waiting',
    winnersInfo = []
  } = gameState || {};

  const currentPlayer = useMemo(() => 
    players ? players.find(p => p.id === userId) : null, 
    [players, userId]
  );
  const currentTurnPlayer = useMemo(() => 
    players ? players.find(p => p.id === currentPlayerId) : null, 
    [players, currentPlayerId]
  );
  
  const maxBet = useMemo(() => 
    players && players.length > 0 ? Math.max(...players.map(p => p.currentBet)) : 0, 
    [players]
  );

  const mainPlayerStack = useMemo(() => {
    return currentPlayer ? currentPlayer.stack : 0;
  }, [currentPlayer]);

  const minRaise = Math.max(0, Number(minRaiseAmount) || 0);
  const maxRaise = Math.max(minRaise, Number(maxRaiseAmount) || mainPlayerStack || 0);
  const isPlayerTurn = currentPlayerId === userId;

  useEffect(() => {
    setTurnTimer(30);
    if (!currentPlayerId || status !== 'in_progress') return;
    
    const interval = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState]);

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

  // Подсвечиваем ровно победную комбинацию: берём первую из winnersInfo
  const [winnerId, winningFiveSet] = useMemo(() => {
    if (!winnersInfo || winnersInfo.length === 0) return [null, new Set()];
    const primary = winnersInfo[0];
    const set = new Set((primary.handCards || []).map(c => `${c.rank}-${c.suit}`));
    return [primary.player?.id || null, set];
  }, [winnersInfo]);

  const isWinningCardForPlayer = useCallback((playerId, card) => {
    if (!card || !winnerId) return false;
    if (playerId !== winnerId) return false;
    return winningFiveSet.has(`${card.rank}-${card.suit}`);
  }, [winnerId, winningFiveSet]);

  const isWinningCommunityCard = useCallback((card) => {
    if (!card) return false;
    return winningFiveSet.has(`${card.rank}-${card.suit}`);
  }, [winningFiveSet]);
  
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

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const handleRaiseChange = (e) => {
    const newValue = Number(e.target.value);
    setRaiseAmount(clamp(newValue, minRaise, maxRaise));
  };

  const handleRebuyClick = () => {
    onRebuy();
    setShowRebuyModal(false);
  };

  const handleAction = (action, value = 0) => {
    if (action === 'raise') {
      if (value < minRaise || value > maxRaise) {
        alert(`Некорректная сумма рейза. Допустимый диапазон: ${minRaise} - ${maxRaise}`);
        return;
      }
    }
    onAction(action, value);
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
          {stage === 'showdown' && winnersInfo && winnersInfo.length > 0 && (
            <div className={styles.combinationInfo}>
              {winnersInfo.map((winner, index) => (
                <div key={index} className={styles.winnerInfo}>
                  {winner.player.name}: {winner.handName}
                </div>
              ))}
            </div>
          )}
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
                isWinning={isWinningCommunityCard(card)}
                isCommunity={true}
              />
            </div>
          ))}
        </div>
        <div className={`${styles.bettingArea} ${winnerAnimation ? styles.chipFlying : ''}`}>
          <div className={styles.betAmount} title="Общий банк">{pot || 0}</div>
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
                showCards={player.id === userId || stage === 'showdown' || status === 'finished'}
                isActive={player.id === currentPlayerId && status !== 'finished'}
                isWinner={winnerAnimation === player.id}
                dealingPhase={dealingPhase}
                yourHand={yourHand}
                isWinningCard={(card) => isWinningCardForPlayer(player.id, card)}
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
          <span className={styles.balanceLabel}>Стек</span>
        </div>
        {currentPlayer && gameState.initialBuyIn && currentPlayer.stack < gameState.initialBuyIn && (
          <Button 
            onClick={() => setShowRebuyModal(true)}
            variant="secondary"
            className={styles.rebuyButton}
          >
            Докупить монеты
          </Button>
        )}
      </div>
      {showRebuyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.rebuyModal}>
            <h3 className={styles.modalTitle}>Докупка монет</h3>
            <p className={styles.modalText}>
              Вы можете докупить монеты до начального стека ({gameState.initialBuyIn} монет).
              Стоимость: {gameState.initialBuyIn - (currentPlayer?.stack || 0)} монет.
              Это действие необратимо для текущей раздачи.
            </p>
            <div className={styles.modalActions}>
              <Button onClick={() => setShowRebuyModal(false)} variant="secondary">
                Отмена
              </Button>
              <Button 
                onClick={handleRebuyClick}
                variant="primary"
                disabled={coins < (gameState.initialBuyIn - (currentPlayer?.stack || 0))}
              >
                Докупить ({gameState.initialBuyIn - (currentPlayer?.stack || 0)} монет)
              </Button>
            </div>
          </div>
        </div>
      )}
      {currentPlayerId && status === 'in_progress' && currentTurnPlayer && (
        <div className={styles.turnTimer}>
          <div className={styles.timerBar}>
            <div 
              className={styles.timerProgress} 
              style={{ 
                width: `${Math.max(0, (turnTimer / 30) * 100)}%`,
                backgroundColor: turnTimer <= 10 ? '#ff6b6b' : '#51cf66'
              }}
            ></div>
          </div>
          <div className={styles.timerText}>
            {Math.max(0, turnTimer)}с — ходит {currentTurnPlayer.name}
          </div>
        </div>
      )}
      {isPlayerTurn && gameState && status !== 'finished' && (
        <div className={styles.actions}>
          {(validActions || []).includes('fold') && <Button onClick={() => handleAction('fold')}>Сбросить</Button>}
          {(validActions || []).includes('check') && <Button onClick={() => handleAction('check')}>Чек</Button>}
          {(validActions || []).includes('call') && callAmount > 0 && (
            <Button onClick={() => handleAction('call')}>Уравнять ({callAmount})</Button>
          )}
          {(validActions || []).includes('raise') && (
            <>
              <Button onClick={() => handleAction('raise', clamp(raiseAmount, minRaise, maxRaise))}>
                Рейз {raiseAmount}
              </Button>
              <div className={styles.raiseContainer}>
                <input 
                  type="range"
                  min={minRaise}
                  max={maxRaise}
                  value={raiseAmount}
                  onChange={handleRaiseChange}
                  className={styles.raiseSlider}
                />
                <div style={{ 
                  fontSize: '11px', 
                  color: 'var(--color-text-secondary)', 
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  {minRaise} - {maxRaise}
                </div>
              </div>
            </>
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