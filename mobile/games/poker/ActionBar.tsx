import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors } from '../../styles/theme';

type Props = {
  canMakeAction: boolean;
  validActions: string[];
  callAmount: number;
  pot: number;
  minRaiseAmount: number;
  maxRaiseAmount: number;
  onAction: (action: string, value?: number) => void;
};

export function ActionBar({ canMakeAction, validActions, callAmount, pot, minRaiseAmount, maxRaiseAmount, onAction }: Props) {
  const [raiseValue, setRaiseValue] = useState(minRaiseAmount || 0);

  useEffect(() => {
    setRaiseValue(minRaiseAmount);
  }, [minRaiseAmount]);

  const can = (a: string) => canMakeAction && validActions.includes(a);

  const handleQuickRaise = (value: number) => {
    const clampedValue = Math.min(maxRaiseAmount, Math.max(minRaiseAmount, Math.floor(value)));
    setRaiseValue(clampedValue);
  };
  
  const handleRaise = () => {
    const clampedValue = Math.min(maxRaiseAmount, Math.max(minRaiseAmount, raiseValue));
    onAction('raise', clampedValue);
  }

  const renderRaiseControls = () => {
    if (!can('raise')) {
      return (
        <TouchableOpacity style={[styles.btn, styles.disabled]} disabled>
          <Text style={styles.btnText}>Рейз</Text>
        </TouchableOpacity>
      );
    }
    return (
      <View style={styles.raiseContainer}>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => handleQuickRaise(pot * 0.5)}><Text style={styles.quickBtnText}>1/2 Пота</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => handleQuickRaise(pot)}><Text style={styles.quickBtnText}>Пот</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => setRaiseValue(maxRaiseAmount)}><Text style={styles.quickBtnText}>All-In</Text></TouchableOpacity>
        </View>
        <View style={styles.raiseInputGroup}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(raiseValue)}
            onChangeText={(t) => setRaiseValue(parseInt(t || '0', 10) || 0)}
          />
          <TouchableOpacity style={styles.raiseButton} onPress={handleRaise}>
            <Text style={styles.btnText}>Рейз {raiseValue}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.btn, !can('fold') && styles.disabled]} disabled={!can('fold')} onPress={() => onAction('fold')}>
        <Text style={styles.btnText}>Сбросить</Text>
      </TouchableOpacity>
      {can('check') ? (
        <TouchableOpacity style={styles.btn} onPress={() => onAction('check')}>
          <Text style={styles.btnText}>Чек</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.btn, !can('call') && styles.disabled]} disabled={!can('call')} onPress={() => onAction('call', callAmount)}>
          <Text style={styles.btnText}>Уравнять {callAmount > 0 ? callAmount : ''}</Text>
        </TouchableOpacity>
      )}
      {renderRaiseControls()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  btnText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { backgroundColor: '#a9a9a9', opacity: 0.7 },
  raiseContainer: {
    flexBasis: '100%',
    gap: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  quickBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  quickBtnText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  raiseInputGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    color: colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
  },
  raiseButton: {
    backgroundColor: '#2e8b57',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 2,
  },
});