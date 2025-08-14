import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadow } from '../../styles/theme';

type Card = { rank: string; suit: 'H' | 'D' | 'C' | 'S' | string };

function suitToSymbol(suit: string) {
  switch (suit?.toUpperCase()) {
    case 'H': return '♥';
    case 'D': return '♦';
    case 'C': return '♣';
    case 'S': return '♠';
    default: return '';
  }
}

function isRed(suit: string) {
  return suit?.toUpperCase() === 'H' || suit?.toUpperCase() === 'D';
}

export function PlayingCard({ card, size = 36, faceUp = true }: { card?: Card; size?: number; faceUp?: boolean }) {
  if (!faceUp || !card) {
    return (
      <View style={[styles.card, styles.faceDown, { width: size, height: size * 1.4 }]} />
    );
  }

  const color = isRed(card.suit) ? colors.error : colors.textPrimary;

  return (
    <View style={[styles.card, { width: size, height: size * 1.4 }]}>
      <Text style={[styles.rank, { color, fontSize: size * 0.4 }]}>{card.rank}</Text>
      <Text style={[styles.suit, { color, fontSize: size * 0.5 }]}>{suitToSymbol(card.suit)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    ...shadow.sm,
  },
  faceDown: {
    backgroundColor: colors.primary,
  },
  rank: {
    fontWeight: '700',
    position: 'absolute',
    top: 4,
    left: 4,
  },
  suit: {
    fontWeight: 'bold',
  },
});