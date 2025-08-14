import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../styles/theme';

type Piece = { type: string; color: 'w' | 'b' } | null;

function pieceToSymbol(p?: Piece | null): string {
  if (!p) return '';
  const map: Record<string, { w: string; b: string }> = {
    k: { w: '♔', b: '♚' },
    q: { w: '♕', b: '♛' },
    r: { w: '♖', b: '♜' },
    b: { w: '♗', b: '♝' },
    n: { w: '♘', b: '♞' },
    p: { w: '♙', b: '♟' },
  };
  const key = (p.type || '').toLowerCase();
  return map[key] ? map[key][p.color] : '';
}

const files = ['a','b','c','d','e','f','g','h'];
const ranks = ['8','7','6','5','4','3','2','1'];

type Props = {
  board: Record<string, Piece>;
  onMove: (from: string, to: string) => void;
  yourColor?: 'w' | 'b';
};

export function ChessOnline({ board, onMove, yourColor = 'w' }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [moves, setMoves] = useState<string[]>([]);
  const orientedFiles = yourColor === 'w' ? files : [...files].reverse();
  const orientedRanks = yourColor === 'w' ? ranks : [...ranks].reverse();

  const handleSquarePress = (sq: string) => {
    if (!selected) {
      setSelected(sq);
    } else {
      if (selected !== sq) onMove(selected, sq);
      setSelected(null);
      setMoves([]);
    }
  };

  return (
    <View style={styles.boardWrapper}>
      <View style={styles.board}> 
        {orientedRanks.map((rank) => (
          <View key={rank} style={styles.row}>
            {orientedFiles.map((file) => {
              const sq = `${file}${rank}`;
              const p = board?.[sq] || null;
              const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 0;
              const isSel = selected === sq;
              const isMove = moves.includes(sq);
              const bg = isSel ? colors.primary : isMove ? '#EADFD8' : (isLight ? '#FFF8F6' : '#F2E9E8');
              const fg = isSel ? '#FFFFFF' : colors.textPrimary;
              return (
                <TouchableOpacity key={sq} style={[styles.cell, { backgroundColor: bg }]} onPress={() => handleSquarePress(sq)}>
                  <Text style={[styles.piece, { color: fg }]}>{pieceToSymbol(p)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const CELL = 38;
const styles = StyleSheet.create({
  boardWrapper: { alignItems: 'center', marginTop: 8 },
  board: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  row: { flexDirection: 'row' },
  cell: { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' },
  piece: { fontSize: CELL * 0.6 },
});


