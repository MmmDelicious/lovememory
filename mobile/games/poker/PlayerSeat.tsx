import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlayingCard } from './PlayingCard';
import { colors, shadow } from '../../styles/theme';
// Предполагаем, что есть компонент UserAvatar. Если нет, создадим простой плейсхолдер.
// import UserAvatar from '../../components/UserAvatar/UserAvatar';

// Простой плейсхолдер для аватара, если его нет
const UserAvatar = ({ player, size }: { player: any, size: number }) => (
  <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={styles.avatarLetter}>{player?.name?.charAt(0) || '?'}</Text>
  </View>
);

type Props = {
  player: any;
  isMainPlayer?: boolean;
  showCards?: boolean;
  isActive?: boolean;
  yourHand?: any[];
};

export function PlayerSeat({ player, isMainPlayer = false, showCards = false, isActive = false, yourHand }: Props) {
  if (!player) return null;

  const cardsToRender = isMainPlayer ? yourHand : player.hand;

  return (
    <View style={[styles.playerContainer, isActive && styles.active]}>
      <UserAvatar player={player} size={isMainPlayer ? 80 : 60} />
      
      <View style={styles.playerInfo}>
        <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
        <View style={styles.stack}>
          <Text style={styles.chipsIcon}>🪙</Text>
          <Text style={styles.stackText}>{player.stack}</Text>
        </View>
      </View>

      {player.inHand && (
        <View style={[styles.playerCards, isMainPlayer && styles.mainPlayerCards]}>
          {cardsToRender?.slice(0, 2).map((card: any, index: number) => (
            <View key={index} style={styles.cardWrapper}>
              <PlayingCard card={card} size={40} faceUp={showCards} />
            </View>
          ))}
        </View>
      )}

      {player.currentBet > 0 && (
        <View style={styles.betIndicator}>
          <Text style={styles.betText}>{player.currentBet}</Text>
        </View>
      )}
      
      {!player.inHand && player.stack > 0 && (
        <View style={styles.foldedIndicator}>
          <Text style={styles.foldedText}>Пас</Text>
        </View>
      )}
      
      {player.isAllIn && (
        <View style={[styles.betIndicator, styles.allInIndicator]}>
          <Text style={styles.betText}>All-in</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  playerContainer: {
    width: 120,
    alignItems: 'center',
    position: 'relative',
  },
  active: {
    // Можно добавить эффект свечения через `shadow`
    ...shadow.md,
    shadowColor: colors.primary,
  },
  avatar: {
    borderWidth: 3,
    borderColor: '#f8f4ef',
    backgroundColor: '#e0d5c9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...shadow.sm,
  },
  avatarLetter: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  playerInfo: {
    backgroundColor: '#c49f72', // Коричневатый цвет с веба
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    width: '90%',
    marginTop: -20,
    paddingTop: 24, // отступ для аватара
    ...shadow.sm,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#443a32',
  },
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9d9c9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  chipsIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  stackText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#443a32',
  },
  playerCards: {
    position: 'absolute',
    top: -30,
    flexDirection: 'row',
    width: 100,
    justifyContent: 'center',
  },
  mainPlayerCards: {
    position: 'relative',
    top: 0,
    marginTop: 8,
  },
  cardWrapper: {
    marginHorizontal: -10,
  },
  betIndicator: {
    position: 'absolute',
    bottom: -15,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    ...shadow.sm,
  },
  allInIndicator: {
    backgroundColor: colors.error,
  },
  betText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  foldedIndicator: {
    position: 'absolute',
    top: '40%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  foldedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});