import React from 'react';
import PropTypes from 'prop-types';
import UserAvatar from '../../UserAvatar/UserAvatar';
import PlayingCard from '../../PlayingCard/PlayingCard';
import styles from './Player.module.css';

const Player = ({ player, isMainPlayer, showCards, isActive, isWinner, dealingPhase, yourHand, isWinningCard }) => {
    if (!player) return null;

    return (
        <div className={`${styles.playerContainer} ${isActive ? styles.active : ''} ${isWinner ? styles.winner : ''}`}>
            <UserAvatar
                user={player}
                className={styles.avatar}
                size="medium"
            />
            
            <div className={styles.playerInfo}>
                <div className={styles.playerName}>
                    {player.name}
                </div>
                <div className={styles.stack}>
                    <span className={styles.chipsIcon}>🪙</span>
                    {player.stack}
                </div>
            </div>

            {(isMainPlayer || player.inHand) && (
                <div className={styles.playerCards}>
                    {isMainPlayer ? (
                        (yourHand && yourHand.length > 0) ? yourHand.map((card, index) => (
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
                        )) : <div className={styles.hiddenCardsPlaceholder} />
                    ) : (
                        [0, 1].map((index) => {
                            // Получаем карты игрока - либо из hand, либо из cards
                            const playerCards = player.hand || player.cards || [];
                            const card = playerCards[index];
                            
                            return (
                                <div
                                    key={index}
                                    className={`${styles.cardWrapper} ${dealingPhase ? styles.cardDealing : ''}`}
                                    style={{ animationDelay: `${index * 0.2 + 0.1}s` }}
                                >
                                    <PlayingCard 
                                        suit={card ? card.suit : null}
                                        rank={card ? card.rank : null}
                                        faceUp={showCards && player.inHand} 
                                        isWinning={showCards && card ? isWinningCard(card) : false}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>
            )}
             {player.currentBet > 0 && (
                <div className={styles.betIndicator}>
                    {player.currentBet}
                </div>
            )}
            {!player.inHand && <div className={styles.foldedIndicator}>Пас</div>}
        </div>
    );
};

Player.propTypes = {
    player: PropTypes.object.isRequired,
    isMainPlayer: PropTypes.bool,
    showCards: PropTypes.bool,
    isActive: PropTypes.bool,
    isWinner: PropTypes.bool,
    dealingPhase: PropTypes.bool,
    yourHand: PropTypes.array,
    isWinningCard: PropTypes.func
};

export default Player;