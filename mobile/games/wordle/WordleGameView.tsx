import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type WordleGameViewProps = {
  gameState: any;
  makeMove: (move: { action: string; value?: number; guess?: string }) => void;
};

export default function WordleGameView({ gameState, makeMove }: WordleGameViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wordle PvP</Text>
      <Text style={styles.status}>Статус: {gameState?.status || 'waiting'}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => makeMove({ action: 'submit_guess', guess: 'СЛОВО' })}
      >
        <Text style={styles.buttonText}>Отправить пример: СЛОВО</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6AAA64',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});