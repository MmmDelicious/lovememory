import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PlayingCard from '../PlayingCard/PlayingCard';
import Button from '../Button/Button';
import { useCurrency } from '../../context/CurrencyContext';
import PokerModal from '../PokerModal/PokerModal';
import styles from './PokerTable.module.css';
import Player from './Player/Player';

interface PokerTableProps {
  gameState: any;
  onAction: (action: string, value?: number) => void;
  onRebuy: (rebuyAmount: number) => void;
  userId: string;
  roomData?: {
    bet: number;
    [key: string]: any;
  };
  onOpenBuyIn?: () => void;
}

const PokerTable: React.FC<PokerTableProps> = ({ gameState, onAction, onRebuy, userId, roomData, onOpenBuyIn }) => {
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
    winnersInfo = [],
    showdownPhase = false,
    playersToShow = [],
    currentShowdownPlayer = null,
    showdownOrder = null
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
    
    // Проверяем, что handCards существует и содержит корректные данные
    if (!primary.handCards || primary.handCards.length === 0) {
      console.warn('[PokerTable] No handCards in winnersInfo:', primary);
      return [primary.player?.id || null, new Set()];
    }
    
    // Создаем Set с правильным форматом карт
    const set = new Set(primary.handCards.map(c => {
      if (!c || !c.rank || !c.suit) {
        console.warn('[PokerTable] Invalid card in handCards:', c);
        return '';
      }
      return `${c.rank}-${c.suit}`;
    }).filter(Boolean));
    
    console.log('[PokerTable] Winning cards set:', Array.from(set));
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

  const handleRebuyClick = (rebuyAmount) => {
    onRebuy(rebuyAmount);
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

  // Проверяем, нужно ли показать сообщение о buy-in
  const needsBuyIn = gameState?.needsBuyIn || (!gameState?.hasBoughtIn && gameState?.status === 'waiting');

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
            {stage === 'showdown' && !showdownPhase && 'Вскрытие'}
            {showdownPhase && 'Выбор действия'}
          </div>
          {showdownPhase && (
            <div className={styles.combinationInfo}>
              <div className={styles.showdownInfo}>
                {currentShowdownPlayer ? (
                  currentShowdownPlayer === userId ? 
                    'Ваша очередь: показать карты или сбросить?' :
                    `Ходит ${players.find(p => p.id === currentShowdownPlayer)?.name || 'Игрок'}`
                ) : (
                  'Вскрытие карт'
                )}
              </div>
            </div>
          )}
          {stage === 'showdown' && !showdownPhase && winnersInfo && winnersInfo.length > 0 && (
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
                showCards={player.id === userId || (player.showCards === true && (stage === 'showdown' || status === 'finished'))}
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
        {currentPlayer && roomData?.bet && currentPlayer.stack < 100 && (
          <Button 
            onClick={() => setShowRebuyModal(true)}
            variant="secondary"
            className={styles.rebuyButton}
          >
            Rebuy
          </Button>
        )}
        
        {needsBuyIn && onOpenBuyIn && (
          <div className={styles.buyInBanner} onClick={onOpenBuyIn}>
            <div className={styles.buyInIcon}>💰</div>
            <div>
              <div className={styles.buyInText}>Сделайте buy-in</div>
              <div className={styles.buyInSubtext}>Нажмите для выбора суммы</div>
            </div>
          </div>
        )}
      </div>
      
      <PokerModal
        isOpen={showRebuyModal}
        onClose={() => setShowRebuyModal(false)}
        onConfirm={handleRebuyClick}
        maxAmount={roomData?.bet || 1000}
        mode="rebuy"
        currentStack={currentPlayer?.stack || 0}
      />
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
      {/* Обычные действия в игре */}
      {isPlayerTurn && gameState && status !== 'finished' && !showdownPhase && (
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

      {/* Действия в фазе showdown */}
      {showdownPhase && currentPlayer && currentShowdownPlayer === userId && (validActions.includes('show') || validActions.includes('muck')) && (
        <div className={styles.actions}>
          <div className={styles.showdownMessage}>
            Ваша очередь: показать карты или сбросить?
          </div>
          <Button onClick={() => handleAction('show')} variant="primary">
            Показать карты
          </Button>
          <Button onClick={() => handleAction('muck')} variant="secondary">
            Сбросить карты
          </Button>
        </div>
      )}

      {/* Информация о текущем showdown игроке */}
      {showdownPhase && currentShowdownPlayer && currentShowdownPlayer !== userId && (
        <div className={styles.showdownWaiting}>
          <div className={styles.waitingMessage}>
            Ждем решения от {players.find(p => p.id === currentShowdownPlayer)?.name || 'игрока'}...
          </div>
        </div>
      )}
    </div>
  );
};

export default PokerTable;