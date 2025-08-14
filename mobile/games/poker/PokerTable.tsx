import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { BounceIn } from 'react-native-reanimated';
import { PlayerSeat } from './PlayerSeat';
import { PlayingCard } from './PlayingCard';
import { useAuth } from '../../context/AuthContext';

type Player = any; // Используем any для простоты, т.к. структура игрока комплексная
type Props = { gameState: any };

export function PokerTable({ gameState }: Props) {
  const { user } = useAuth();
  const { players = [], communityCards = [], pot = 0, stage = '', currentPlayerId } = gameState || {};
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  // Создаем карту расположения игроков, как на вебе
  const playerSeatMap = useMemo(() => {
    const seatMap: (Player | null)[] = Array(5).fill(null);
    if (!players || players.length === 0) return seatMap;

    const mainPlayer = players.find((p: Player) => String(p.id) === String(user?.id));
    const otherPlayers = players.filter((p: Player) => String(p.id) !== String(user?.id));

    if (mainPlayer) {
      seatMap[0] = mainPlayer;
    }

    otherPlayers.slice(0, 4).forEach((p: Player, index: number) => {
      seatMap[index + 1] = p;
    });

    return seatMap;
  }, [players, user?.id]);

  const tableWidth = screenHeight * 1.5; // Пропорции стола как на вебе
  const tableHeight = screenHeight * 0.9;

  // Адаптивные позиции для 5 мест
  const seatPositions = {
    '0': { bottom: -tableHeight * 0.1, left: tableWidth / 2 }, // Игрок
    '1': { top: tableHeight / 2, left: -tableWidth * 0.05 }, // Слева
    '2': { top: -tableHeight * 0.08, left: tableWidth * 0.25 }, // Сверху-слева
    '3': { top: -tableHeight * 0.08, right: tableWidth * 0.25 }, // Сверху-справа
    '4': { top: tableHeight / 2, right: -tableWidth * 0.05 }, // Справа
  };

  return (
    <View style={styles.gameContainer}>
      <View style={[styles.pokerTable, { width: tableWidth, height: tableHeight, borderRadius: tableHeight / 2 }]}>
        <View style={styles.stageContainer}>
          <Text style={styles.stageText}>{stage.toUpperCase()}</Text>
        </View>
        <View style={styles.centerContent}>
          <View style={styles.potContainer}>
            <Text style={styles.potText}>🪙 {pot}</Text>
          </View>
          <View style={styles.communityCards}>
            {communityCards.map((card: any, index: number) => (
              <Animated.View key={index} entering={BounceIn.delay(index * 100)}>
                <PlayingCard card={card} size={screenWidth * 0.06} />
              </Animated.View>
            ))}
          </View>
        </View>

        {playerSeatMap.map((player, index) => (
          <View key={player?.id || `seat-${index}`} style={[styles.playerPosition, seatPositions[index as keyof typeof seatPositions]]}>
            {player ? (
              <PlayerSeat
                player={player}
                isMainPlayer={String(player.id) === String(user?.id)}
                isActive={String(player.id) === String(currentPlayerId)}
                showCards={String(player.id) === String(user?.id) || stage === 'showdown'}
                yourHand={String(player.id) === String(user?.id) ? gameState.yourHand : player.hand}
              />
            ) : (
              <View style={styles.emptySeat}><Text style={styles.emptySeatText}>🪑</Text></View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pokerTable: {
    backgroundColor: '#637d5d', // --table-green
    borderWidth: 30,
    borderColor: '#d09874', // --table-border
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  stageContainer: {
    position: 'absolute',
    top: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  stageText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  potContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 8,
  },
  potText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  communityCards: {
    flexDirection: 'row',
    gap: 8,
  },
  playerPosition: {
    position: 'absolute',
    transform: [{ translateX: -60 }], // Центрируем игрока (ширина 120)
  },
  emptySeat: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySeatText: {
    fontSize: 30,
  }
});