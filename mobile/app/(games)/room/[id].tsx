import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useGameSocket } from '../../../hooks/useGameSocket';
import PokerGameView from '../../../games/poker/PokerGameView';
import WordleGameView from '../../../games/wordle/WordleGameView';
import { colors } from '../../../styles/theme';

const GameComponents: { [key: string]: React.ComponentType<any> } = {
  poker: PokerGameView,
  wordle: WordleGameView,
};

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isConnected, gameState, makeMove, rebuy, leaveGame } = useGameSocket(id || '');

  const handleLeave = () => {
    leaveGame();
    router.back();
  };

  const renderGame = () => {
    if (!gameState || !gameState.gameType) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Загрузка состояния игры...</Text>
        </View>
      );
    }
    const GameComponent = GameComponents[gameState.gameType];
    if (GameComponent) {
      return <GameComponent gameState={gameState} makeMove={makeMove} rebuy={rebuy} />;
    }
    return <Text style={styles.errorText}>Неизвестный тип игры: {gameState.gameType}</Text>;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Комната #{id}</Text>
        <Text style={[styles.subtitle, { color: isConnected ? 'green' : 'red' }]}>
          {isConnected ? '● Онлайн' : '● Оффлайн'}
        </Text>
      </View>

      {renderGame()}

      <TouchableOpacity style={styles.button} onPress={handleLeave}>
        <Text style={styles.buttonText}>Покинуть игру</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFF8F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A3F3D',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8C7F7D',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'red',
  },
  button: {
    marginTop: 'auto',
    backgroundColor: '#D97A6C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});