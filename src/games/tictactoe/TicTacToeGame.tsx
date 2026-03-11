// src/games/tictactoe/TicTacToeGame.tsx
import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useWindowDimensions, Modal } from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../core/theme';
import { useGameStore } from '../../core/store';
import { createInitialState, applyMove, isValidMove, resetState, TicState } from './tictactoeLogic';
import type { GameScreenProps } from '../registry';

export default forwardRef(function TicTacToeGame(
  { mode, onGameEnd, onExit, showHeader = true }: GameScreenProps,
  ref
) {
  const [infoVisible, setInfoVisible] = useState(false);
  const { width, height } = useWindowDimensions();
  const boardSize = Math.min(width - 48, height * 0.5, 420);
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

  useImperativeHandle(ref, () => ({ reset: () => handleReset() }));

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
      {showHeader !== false && (
        <GameHeader title="Tic Tac Toe" onBack={onExit} onInfo={() => setInfoVisible(true)} />
      )}

      <View style={[styles.board, { width: boardSize, height: boardSize }]}>
        {Array.from({ length: 9 }).map((_, i) => renderCell(i))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}><Text style={styles.resetBtnText}>↺ Reset</Text></TouchableOpacity>
      </View>

      <View style={styles.rules}>
        <Text style={styles.rulesText}>Classic 3×3 Tic-Tac-Toe. X = Red, O = Blue. Get three in a row to win.</Text>
      </View>

      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 300, backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
            <Text style={{ fontWeight: '800', fontSize: 18 }}>Tic Tac Toe</Text>
            <Text style={{ marginTop: 8 }}>Classic 3×3 Tic-Tac-Toe. X = Red, O = Blue. Get three in a row to win.</Text>
            <TouchableOpacity onPress={() => setInfoVisible(false)} style={{ marginTop: 12 }}>
              <Text style={{ color: Colors.coastalBlue, fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8ceaa',
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
  title: { flex: 1, textAlign: 'center', fontSize: FontSize.xl, fontWeight: '700', color: '#525e75' },

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
