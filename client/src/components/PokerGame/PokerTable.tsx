import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PlayingCard from '../PlayingCard/PlayingCard';
import Button from '../Button/Button';
import { useCoins } from '../../store/hooks';
import PokerModal from '../PokerModal/PokerModal';
import styles from './PokerTable.module.css';
import Player from './Player/Player';
import { toast } from '../../context/ToastContext';
import type { GameState, GameRoom } from '../../../types/common';
import type { PokerGameState } from '../../../types/game.types';
interface PokerTableProps {
  gameState: PokerGameState | null;
  onAction: (action: string, value?: number) => void;
  onRebuy: (rebuyAmount: number) => void;
  userId: string;
  roomData?: GameRoom | null;
  onOpenBuyIn?: () => void;
}
const PokerTable: React.FC<PokerTableProps> = ({ gameState, onAction, onRebuy, userId, roomData, onOpenBuyIn }) => {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [animatingCards, setAnimatingCards] = useState<number[]>([]);
  const [dealingPhase, setDealingPhase] = useState(false);
  const [prevStage, setPrevStage] = useState<string | null>(null);
  const [showRebuyModal, setShowRebuyModal] = useState(false);
  const [winnerAnimation, setWinnerAnimation] = useState<string | null>(null);
  const [turnTimer, setTurnTimer] = useState(30);
  const coins = useCoins();
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
  // Сервер теперь присылает minRaise и maxRaise как итоговые суммы (total bet).
  const serverMinRaise = Number(minRaiseAmount) || 0;
  const serverMaxRaise = Number(maxRaiseAmount) || 0; // ожидаем итоговую ставку

  const currentBet = currentPlayer?.currentBet || 0;
  const minRaise = Math.max(currentBet, serverMinRaise, 0);
  const maxRaise = Math.max(minRaise, serverMaxRaise || (currentBet + mainPlayerStack) || 0);
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
  }, [currentPlayerId, status]);
  useEffect(() => {
    if (prevStage !== stage && stage) {
      setPrevStage(stage);
      if (stage === 'pre-flop' && prevStage === null) {
        setDealingPhase(true);
        setTimeout(() => setDealingPhase(false), 2000);
      }
      if ((stage === 'flop' && prevStage === 'pre-flop') ||
          (stage === 'turn' && prevStage === 'flop') ||
          (stage === 'river' && prevStage === 'turn')) {
        const newCards: number[] = [];
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
  }, [gameState?.yourHand, stage]);
  useEffect(() => {
    if (gameState && gameState.status === 'finished' && gameState.winner) {
      const winnerId = typeof gameState.winner === 'object' ? (gameState.winner as any).id : gameState.winner;
      setWinnerAnimation(winnerId);
      setTimeout(() => setWinnerAnimation(null), 3000);
    }
  }, [gameState?.status, gameState?.winner]);
  useEffect(() => {
    const baseline = currentPlayer?.currentBet || 0;
    const initial = clamp(Math.max(minRaise, baseline), minRaise, maxRaise);
    setRaiseAmount(initial);
  }, [minRaise, maxRaise, currentPlayer?.currentBet]);
  const [winnerId, winningFiveSet] = useMemo(() => {
    if (!winnersInfo || winnersInfo.length === 0) return [null, new Set()];
    const primary = winnersInfo[0];
    if (!primary || !primary.handCards || primary.handCards.length === 0) {
      console.warn('[PokerTable] No handCards in winnersInfo:', primary);
      return [primary?.player?.id || null, new Set()];
    }
    const set = new Set(primary.handCards.map(c => {
      if (!c || !c.rank || !c.suit) {
        console.warn('[PokerTable] Invalid card in handCards:', c);
        return '';
      }
      return `${c.rank}-${c.suit}`;
    }).filter(Boolean));

    return [primary.player?.id || null, set];
  }, [winnersInfo]);
  const isWinningCardForPlayer = useCallback((playerId: string, card: any) => {
    if (!card || !winnerId) return false;
    if (playerId !== winnerId) return false;
    return winningFiveSet.has(`${card.rank}-${card.suit}`);
  }, [winnerId, winningFiveSet]);
  const isWinningCommunityCard = useCallback((card: any) => {
    if (!card) return false;
    return winningFiveSet.has(`${card.rank}-${card.suit}`);
  }, [winningFiveSet]);
  const getPlayerSeatMap = () => {
    if (!players || players.length === 0) return Array(5).fill(null);
    
    try {
      // Показываем всех игроков в комнате, независимо от buy-in статуса
      // Это позволяет видеть кто ожидает buy-in
      
      const mainPlayer = players.find(p => p?.id === userId) || null;
      const others = players.filter(p => p?.id !== userId) || [];
      const seats = [mainPlayer];
      
      
      for (let i = 0; i < 4; i++) {
        seats.push(others[i] || null);
      }
      return seats;
    } catch (error) {
      console.error('[PokerTable] Error in getPlayerSeatMap:', error);
      return Array(5).fill(null);
    }
  };
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const handleRaiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    const newValue = Number.isFinite(parsed) ? parsed : minRaise;
    setRaiseAmount(clamp(newValue, minRaise, maxRaise));
  };
  const handleRebuyClick = (rebuyAmount: number) => {
    onRebuy(rebuyAmount);
    setShowRebuyModal(false);
  };
  const handleAction = (action: string, value = 0) => {
    console.log(`🎯 [POKER FRONTEND] Player action triggered`, {
      timestamp: new Date().toISOString(),
      userId,
      action,
      value,
      gameStage: stage,
      currentPlayerId,
      isMyTurn: currentPlayerId === userId,
      validActions,
      minRaise,
      maxRaise,
      callAmount,
      playerStack: currentPlayer?.stack,
      showdownPhase
    });

    if (action === 'raise') {
      if (value < minRaise || value > maxRaise) {
        console.warn(`❌ [POKER FRONTEND] Invalid raise amount`, {
          value,
          minRaise,
          maxRaise,
          reason: value < minRaise ? 'Below minimum' : 'Above maximum'
        });
        toast.warning(`Некорректная сумма рейза. Допустимый диапазон: ${minRaise} - ${maxRaise}`, 'Некорректная ставка');
        return;
      }
      console.log(`✅ [POKER FRONTEND] Raise amount validated`, { value, range: `${minRaise}-${maxRaise}` });
    }
    
    console.log(`📤 [POKER FRONTEND] Sending action to server via onAction callback`, { action, value });
    onAction(action, value);
  };
  // Логика показа баннера buy-in
  const needsBuyIn = Boolean(gameState?.needsBuyIn);
  const hasBoughtIn = Boolean(gameState?.hasBoughtIn);
  const showBuyInBanner = needsBuyIn && !hasBoughtIn && gameState;
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
                hasBoughtIn={Boolean(player.hasBoughtIn)}
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
          >
            Rebuy
          </Button>
        )}
        {showBuyInBanner && onOpenBuyIn && (
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
      {}
      {isPlayerTurn && gameState && status !== 'finished' && !showdownPhase && (
        <div className={styles.actions}>
          {(validActions || []).includes('fold') && <Button onClick={() => handleAction('fold')}>Сбросить</Button>}
          {(validActions || []).includes('check') && <Button onClick={() => handleAction('check')}>Чек</Button>}
          {(validActions || []).includes('call') && callAmount > 0 && (
            <Button onClick={() => handleAction('call')}>Уравнять ({callAmount})</Button>
          )}
          {(validActions || []).includes('raise') && maxRaise > minRaise && (
            <>
              <Button onClick={() => handleAction('raise', clamp(raiseAmount, minRaise, maxRaise))}>
                Рейз до {raiseAmount}
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
      {}
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
      {}
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
