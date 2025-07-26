import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import PlayingCard from '../PlayingCard/PlayingCard';
import Button from '../Button/Button';
import styles from './PokerTable.module.css';
import avatarImage from './assets/avatar.png';
import Avatar from '../Avatar/Avatar';

const PokerTable = ({ gameState, onAction, userId }) => {
  // Early return ДОЛЖЕН быть самым первым, до всех хуков
  if (!gameState) return null;

  // ВСЕ хуки должны быть в самом начале, до любых conditional returns
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [animatingCards, setAnimatingCards] = useState([]);
  const [dealingPhase, setDealingPhase] = useState(false);
  const [prevStage, setPrevStage] = useState(null);

  const { players, communityCards, pot, currentPlayerId, stage, allowedActions, minRaiseAmount, currentBet, winningHandCards } = gameState;

  // Перемещаем все хуки сюда, чтобы они выполнялись всегда
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
    setRaiseAmount(minRaise);
  }, [minRaise]);

  // Теперь все conditional returns идут ПОСЛЕ всех хуков
  if (gameState.status === 'waiting' || gameState.stage === 'waiting' || (players && players.length < 2)) {
    return (
      <div className={styles.gameContainer}>
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
      </div>
    );
  }

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

  // Функция для получения аватара  
  const getAvatarUrl = () => {
    return avatarImage;
  };

  const renderPlayerArea = (player, position) => {
    if (!player) return null;

    const isMainPlayer = player.id === userId;
    const showCards = (stage === 'showdown' && !player.inHand) || isMainPlayer || (gameState.status === 'finished');
    const isActive = player.id === currentPlayerId && gameState.status !== 'finished';

    return (
      <div key={player.id} className={`${styles.playerPosition} ${styles[`playerPosition${position}`]} ${isActive ? styles.active : ''}`}>
        {/* Аватар игрока */}
        <Avatar
          src={getAvatarUrl()}
          alt={`${player.name}'s avatar`}
          className={styles.avatar}
          size="medium"
          variant="circle"
        />
        
        {/* Информация об игроке */}
        <div className={styles.playerInfo}>
          <div className={styles.playerName}>
            {player.name} {player.isDealer && '🎯'}
          </div>
          <div className={styles.playerStats}>
            <span className={styles.stack}>
              <img 
                src="https://i.ibb.co/9hbdxJ3/chips-icon.png" 
                alt="chips icon" 
                className={styles.chipsIcon}
                style={{ width: '21px', height: '21px', marginRight: '7px' }}
              />
              {player.stack}
            </span>
            {player.currentBet > 0 && <span className={styles.bet}>Ставка: {player.currentBet}</span>}
            {!player.inHand && <span className={styles.folded}>Пас</span>}
          </div>
        </div>

        {/* Карты игрока */}
        <div className={styles.playerCards}>
          {isMainPlayer ? (
            // Для основного игрока показываем реальные карты
            (player.hand && player.hand.length > 0) ? player.hand.map((card, index) => (
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
            // Для остальных игроков всегда показываем 2 рубашки
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
  
  return (
    <div className={styles.gameContainer}>
      <div className={styles.pokerTable}>
        {/* Deck container */}
        <div className={styles.deckContainer}>
          <PlayingCard faceUp={false} />
        </div>
        
        {/* Stage display */}
        <div className={styles.stageContainer}>
          <div className={styles.stage}>
            {stage === 'pre-flop' && 'Пре-флоп'}
            {stage === 'flop' && 'Флоп'}
            {stage === 'turn' && 'Тёрн'}
            {stage === 'river' && 'Ривер'}
            {stage === 'showdown' && 'Вскрытие'}
          </div>
        </div>

        {/* Community Cards */}
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

        {/* Central BET plaque */}
        <div className={styles.bettingArea}>
          <button className={styles.betButton}>BET</button>
          <div className={styles.betAmount}>{pot}</div>
        </div>

        {/* Table chips */}
        <div className={styles.chipStack}>
          <div className={`${styles.chip} ${styles.red}`}></div>
          <div className={`${styles.chip} ${styles.blue}`}></div>
          <div className={`${styles.chip} ${styles.green}`}></div>
        </div>

        {/* Рендерим всех игроков в их позициях вокруг стола */}
        {players.map((player) => 
          renderPlayerArea(player, getPlayerPosition(player.id))
        )}
      </div>

      {/* Decorative elements */}
      <div className={styles.decorations}>
        <div className={`${styles.decoHeart} ${styles.heart1}`}></div>
        <div className={`${styles.decoHeart} ${styles.heart2}`}></div>
        <div className={`${styles.decoHeart} ${styles.heart3}`}></div>
        <div className={`${styles.decoHeart} ${styles.heart4}`}></div>
        <div className={`${styles.decoHeart} ${styles.heart5}`}></div>
        <div className={`${styles.decoHeart} ${styles.heart6}`}></div>
        <img 
          className={styles.rose} 
          src="https://i.ibb.co/Y0KjC0p/rose.png" 
          alt="rose decoration" 
        />
      </div>

      {/* Likes counter */}
      <div className={styles.likesCounter}>
        <span className={styles.heartIcon}>♡</span>
        <span className={styles.count}>10</span>
      </div>

      {/* Action buttons */}
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