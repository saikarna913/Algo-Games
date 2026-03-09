// src/games/tictactoe/TicTacToeGame.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../core/theme';
import { useGameStore } from '../../core/store';
import { createInitialState, applyMove, isValidMove, resetState, TicState } from './tictactoeLogic';
import type { GameScreenProps } from '../registry';

export default function TicTacToeGame({ mode, onGameEnd, onExit }: GameScreenProps) {
  const [state, setState] = useState<TicState>(() => createInitialState());
  const addScore = useGameStore((s) => s.addScore);

  const handleCellPress = useCallback((idx: number) => {
    if (state.gameOver) return;
    if (!isValidMove(idx, state.board)) return;

    const newState = applyMove(state, idx);
    setState(newState);

    if (newState.gameOver && newState.winner) {
      if (newState.winner !== 'draw') addScore(newState.winner as 'red' | 'blue', 1);
      setTimeout(() => onGameEnd(newState.winner!), 500);
    }
  }, [state, addScore, onGameEnd]);

  const handleReset = useCallback(() => {
    setState(resetState(state));
  }, [state]);

  const renderCell = (idx: number) => {
    const v = state.board[idx];
    const label = v === 0 ? 'X' : v === 1 ? 'O' : '';
    const color = v === 0 ? Colors.playerRed : v === 1 ? Colors.playerBlue : Colors.midnightNavy;
    const isLast = state.lastMove === idx;

    return (
      <TouchableOpacity key={idx} style={[styles.cell, isLast && styles.cellLast]} onPress={() => handleCellPress(idx)}>
        <Text style={[styles.cellText, { color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onExit} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Tic Tac Toe</Text>
      </View>

      <View style={styles.board}>
        {Array.from({ length: 9 }).map((_, i) => renderCell(i))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}><Text style={styles.resetBtnText}>↺ Reset</Text></TouchableOpacity>
      </View>

      <View style={styles.rules}>
        <Text style={styles.rulesText}>Classic 3×3 Tic-Tac-Toe. X = Red, O = Blue. Get three in a row to win.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.base,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  backBtn: { paddingRight: Spacing.md },
  backBtnText: { fontSize: FontSize.md, color: Colors.coastalBlue, fontWeight: '600' },
  title: { flex: 1, textAlign: 'center', fontSize: FontSize.xl, fontWeight: '700', color: Colors.midnightNavy },

  board: {
    width: 300,
    height: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: BorderRadius.md,
    marginTop: Spacing.base,
    backgroundColor: Colors.cardBg,
    ...Shadow.md,
  },
  cell: {
    width: '33.333%',
    height: '33.333%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cellLast: { backgroundColor: Colors.lightBlue },
  cellText: { fontSize: 36, fontWeight: '800' },

  controls: { marginTop: Spacing.base },
  resetBtn: { backgroundColor: Colors.deepTeal, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, borderRadius: BorderRadius.full },
  resetBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },

  rules: { marginTop: Spacing.base, backgroundColor: Colors.cardBg, padding: Spacing.base, borderRadius: BorderRadius.md, ...Shadow.sm },
  rulesText: { color: Colors.textSecondary }
});
