import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { PokerTable } from './PokerTable';
import { ActionBar } from './ActionBar';
import { colors } from '../../styles/theme';
import * as ScreenOrientation from 'expo-screen-orientation';

type PokerGameViewProps = {
  gameState: any;
  makeMove: (move: { action: string; value?: number; guess?: string }) => void;
  rebuy: () => void;
};

export default function PokerGameView({ gameState, makeMove, rebuy }: PokerGameViewProps) {
  useEffect(() => {
    // При монтировании компонента блокируем ориентацию в ландшафтном режиме
    async function lockOrientation() {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    }
    lockOrientation();

    // При размонтировании возвращаем портретный режим
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);
  
  const canMakeAction = !!gameState?.canMakeAction;
  const validActions: string[] = gameState?.validActions || [];
  const callAmount = gameState?.callAmount || 0;
  const pot = gameState?.pot || 0;
  const minRaiseAmount = gameState?.minRaiseAmount || 0;
  const maxRaiseAmount = gameState?.maxRaiseAmount || 0;

  return (
    <View style={styles.container}>
      <View style={styles.tableContainer}>
        <PokerTable gameState={gameState} />
      </View>
      <View style={styles.uiContainer}>
        {/* Панель действий и другая информация будет здесь */}
        <ActionBar
          canMakeAction={canMakeAction}
          validActions={validActions}
          callAmount={callAmount}
          pot={pot}
          minRaiseAmount={minRaiseAmount}
          maxRaiseAmount={maxRaiseAmount}
          onAction={(action, value) => makeMove({ action, value })}
        />
        <TouchableOpacity style={styles.rebuyButton} onPress={rebuy}>
          <Text style={styles.rebuyButtonText}>Rebuy / Add-on</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fdedde', // --bg-color from web
  },
  tableContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uiContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  rebuyButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 20,
  },
  rebuyButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});