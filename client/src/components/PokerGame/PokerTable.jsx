import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import PlayingCard from '../PlayingCard/PlayingCard';
import Button from '../Button/Button';
import styles from './PokerTable.module.css';

const PokerTable = ({ gameState, onAction, userId }) => {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [animatingCards, setAnimatingCards] = useState([]);
  const [dealingPhase, setDealingPhase] = useState(false);
  const [prevStage, setPrevStage] = useState(null);

  if (!gameState) return null;

  const { players, communityCards, pot, currentPlayerId, stage, allowedActions, minRaiseAmount, currentBet, winningHandCards } = gameState;
  
  if (gameState.status === 'waiting' || gameState.stage === 'waiting' || (players && players.length < 2)) {
    return (
      <div className={styles.gameContainer}>
        <div className={styles.opponentArea}></div>
        
        <div className={styles.pokerTable}>
          <div className={styles.deckContainer}>
            <PlayingCard faceUp={false} />
          </div>
          
          <div className={styles.waitingContainer}>
            <div className={styles.waitingMessage}>
              <div className={styles.waitingIcon}>⏳</div>
              <div className={styles.waitingText}>Ожидание второго игрока...</div>
            </div>
          </div>
        </div>
        
        <div className={styles.playerArea}></div>
      </div>
    );
  }
  
  const currentPlayer = players.find(p => p.id === userId);
  const maxBet = Math.max(...players.map(p => p.currentBet));
  const callAmount = currentPlayer ? Math.min(maxBet - currentPlayer.currentBet, currentPlayer.stack) : 0;

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

  const isWinningCard = (card) => {
    if (!winningHandCards || winningHandCards.length === 0) return false;
    return winningHandCards.some(wc => wc.rank === card.rank && wc.suit === card.suit);
  };

  // Функция для определения позиции игрока вокруг стола (0-4)
  const getPlayerPosition = (playerId) => {
    if (playerId === userId) return 0; // Основной игрок всегда в позиции 0 (внизу)
    
    const otherPlayers = players.filter(p => p.id !== userId);
    const playerIndex = otherPlayers.findIndex(p => p.id === playerId);
    return playerIndex + 1; // Позиции 1-4 для остальных игроков
  };

  const renderPlayerArea = (player, position) => {
    if (!player) return null;

    const isMainPlayer = player.id === userId;
    const showCards = (stage === 'showdown' && !player.inHand) || isMainPlayer || (gameState.status === 'finished');
    const isActive = player.id === currentPlayerId && gameState.status !== 'finished';

    return (
      <div className={`${styles.playerPosition} ${styles[`playerPosition${position}`]} ${isActive ? styles.active : ''}`}>
        <div className={styles.playerCards}>
          {(player.hand && player.hand.length > 0) ? player.hand.map((card, index) => (
            <div
              key={index}
              className={`${styles.cardWrapper} ${dealingPhase ? styles.cardDealing : ''}`}
              style={{ animationDelay: `${index * 0.2 + (isMainPlayer ? 0 : 0.1)}s` }}
            >
              <PlayingCard 
                suit={card.suit} 
                rank={card.rank} 
                faceUp={showCards} 
                isWinning={isWinningCard(card)}
              />
            </div>
          )) : null}
        </div>
        <div className={styles.playerInfo}>
          <div className={styles.playerName}>
            {player.name} {player.isDealer && '🎯'}
          </div>
          <div className={styles.playerStats}>
            <span className={styles.stack}>💰{player.stack}</span>
            {player.currentBet > 0 && <span className={styles.bet}>Ставка: {player.currentBet}</span>}
            {!player.inHand && <span className={styles.folded}>Пас</span>}
          </div>
        </div>
      </div>
    );
  };
  
  const isPlayerTurn = currentPlayerId === userId;
  
  const mainPlayerStack = useMemo(() => {
    const player = players.find(p => p.id === userId);
    return player ? player.stack : 0;
  }, [players, userId]);

  const minRaise = minRaiseAmount || 0;
  const maxRaise = mainPlayerStack;

  useState(() => {
    setRaiseAmount(minRaise);
  }, [minRaise]);

  const handleRaiseChange = (e) => {
    setRaiseAmount(Number(e.target.value));
  };
  
  return (
    <div className={styles.gameContainer}>
      <div className={styles.pokerTable}>

        

        <div className={styles.deckContainer}>
          <PlayingCard faceUp={false} />
        </div>
        
        <div className={styles.potContainer}>
          <div className={styles.chipStack}>
            <div className={`${styles.chip} ${styles.red}`}>5</div>
            <div className={`${styles.chip} ${styles.blue}`}>10</div>
            <div className={`${styles.chip} ${styles.green}`}>25</div>
          </div>
          <span className={styles.pot}>{pot}</span>
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
          {communityCards.map((card, index) => (
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

        {/* Рендерим всех игроков в их позициях вокруг стола */}
        {players.map((player) => 
          renderPlayerArea(player, getPlayerPosition(player.id))
        )}
      </div>

      {isPlayerTurn && gameState.status !== 'finished' && (
        <div className={styles.actions}>
          {allowedActions.includes('fold') && <Button onClick={() => onAction('fold')}>Сбросить</Button>}
          {allowedActions.includes('check') && <Button onClick={() => onAction('check')}>Чек</Button>}
          {allowedActions.includes('call') && <Button onClick={() => onAction('call')}>Уравнять {callAmount > 0 ? ` (${callAmount})` : ''}</Button>}
          
          {allowedActions.includes('raise') && (
            <div className={styles.raiseContainer}>
              <Button onClick={() => onAction('raise', raiseAmount)} variant="primary">
                Повысить до {raiseAmount}
              </Button>
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
  userId: PropTypes.string.isRequired,
};

export default PokerTable; 