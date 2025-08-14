import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useGameSocket } from '../../hooks/useGameSocket';
import { PokerTable } from '../poker/PokerTable';
import { ActionBar } from '../poker/ActionBar';
import { ChessOnline } from '../chess/ChessOnline';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isConnected, gameState, makeMove, rebuy, newHandStarted, actionLog, lastActionByPlayer, turnProgress } = useGameSocket(id || '');
  const isPoker = gameState?.gameType === 'poker';
  const isQuiz = gameState?.gameType === 'quiz';
  const isChess = gameState?.gameType === 'chess';
  const winnersInfo = gameState?.winnersInfo || [];
  const canMakeAction = !!gameState?.canMakeAction;
  const validActions: string[] = gameState?.validActions || [];
  const callAmount = gameState?.callAmount || 0;
  const minRaiseAmount = gameState?.minRaiseAmount || 0;
  const maxRaiseAmount = gameState?.maxRaiseAmount || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Комната #{id}</Text>
      <Text style={styles.subtitle}>Сокет: {isConnected ? 'подключен' : 'нет'}</Text>
      <Text style={styles.subtitle}>Статус: {gameState?.status || 'waiting'}</Text>
      {isPoker && (
        <>
          <PokerTable gameState={{ ...gameState, turnProgress }} />
          {newHandStarted && (
            <View style={styles.banner}><Text style={styles.bannerText}>Новая раздача!</Text></View>
          )}
          {Array.isArray(winnersInfo) && winnersInfo.length > 0 && (
            <View style={styles.winnerBox}>
              <Text style={styles.winnerTitle}>Победитель</Text>
              {winnersInfo.map((w: any, idx: number) => (
                <Text key={idx} style={styles.winnerText}>
                  {w.player?.name || w.player?.id} — {w.handName} (+{Math.round(w.pot)})
                </Text>
              ))}
            </View>
          )}
          <ActionBar
            canMakeAction={canMakeAction}
            validActions={validActions}
            callAmount={callAmount}
            minRaiseAmount={minRaiseAmount}
            maxRaiseAmount={maxRaiseAmount}
            onAction={(action, value) => makeMove({ action, value })}
          />
          <TouchableOpacity style={[styles.button, { marginTop: 8 }]} onPress={rebuy}>
            <Text style={styles.buttonText}>Rebuy</Text>
          </TouchableOpacity>
          {/* Mini action log */}
          <View style={styles.logBox}>
            {actionLog.slice(0, 5).map((line, idx) => (
              <Text key={idx} style={styles.logLine}>{line}</Text>
            ))}
          </View>
        </>
      )}
      {isQuiz && (
        <View style={styles.quizBox}>
          <Text style={styles.quizTitle}>Викторина</Text>
          {!!gameState?.currentQuestion && (
            <>
              <Text style={styles.quizQuestion}>{gameState.currentQuestion.question}</Text>
              <Text style={styles.quizTimer}>Время: {gameState.currentQuestion.timeRemaining}s</Text>
              <View style={{ marginTop: 8 }}>
                {(gameState.currentQuestion.options || []).map((opt: string, idx: number) => (
                  <TouchableOpacity key={idx} style={styles.quizOption} onPress={() => makeMove(idx)}>
                    <Text style={styles.quizOptionText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          {!gameState?.currentQuestion && (
            <Text style={styles.quizStatus}>Ожидание следующего вопроса…</Text>
          )}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.quizScore}>Счет:</Text>
            {Array.isArray(gameState?.players) && (gameState.players as any[]).map((pid: any) => (
              <Text key={String(pid)} style={styles.quizScoreLine}>{String(pid)}: {gameState?.scores?.[pid] ?? 0}</Text>
            ))}
          </View>
        </View>
      )}
      {isChess && (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <ChessOnline
            board={gameState?.board || {}}
            yourColor={gameState?.players[0] === (gameState as any)?.yourId ? 'w' : 'b'}
            onMove={(from, to) => makeMove({ from, to })}
          />
        </View>
      )}
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Назад</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#4A3F3D', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#8C7F7D', marginTop: 4, textAlign: 'center' },
  button: { marginTop: 16, backgroundColor: '#D97A6C', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignSelf: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  banner: { backgroundColor: '#EADFD8', padding: 8, borderRadius: 12, alignItems: 'center', marginHorizontal: 16, marginBottom: 8 },
  bannerText: { color: '#4A3F3D', fontWeight: '700' },
  winnerBox: { backgroundColor: '#FFF8F6', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F2E9E8', marginHorizontal: 16, marginVertical: 8 },
  winnerTitle: { color: '#4A3F3D', fontWeight: '700', marginBottom: 4 },
  winnerText: { color: '#8C7F7D' },
  logBox: { marginTop: 8, marginHorizontal: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F2E9E8', borderRadius: 12, padding: 8 },
  logLine: { color: '#8C7F7D', fontSize: 12 },
  quizBox: { marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F2E9E8', borderRadius: 12, padding: 12 },
  quizTitle: { color: '#4A3F3D', fontWeight: '800', fontSize: 16, marginBottom: 6 },
  quizQuestion: { color: '#4A3F3D', fontWeight: '700' },
  quizTimer: { color: '#8C7F7D', marginTop: 2 },
  quizOption: { backgroundColor: '#FFF8F6', borderRadius: 10, borderWidth: 1, borderColor: '#F2E9E8', paddingHorizontal: 10, paddingVertical: 8, marginTop: 6 },
  quizOptionText: { color: '#4A3F3D', fontWeight: '600' },
  quizStatus: { color: '#8C7F7D' },
  quizScore: { color: '#4A3F3D', fontWeight: '700' },
  quizScoreLine: { color: '#8C7F7D' },
});


