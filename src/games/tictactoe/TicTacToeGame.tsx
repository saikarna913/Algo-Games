// src/games/tictactoe/TicTacToeGame.tsx
import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, useWindowDimensions,
} from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { useGameStore } from '../../core/store';
import { createInitialState, applyMove, isValidMove, resetState, TicState } from './tictactoeLogic';
import type { GameScreenProps } from '../registry';

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  creamLt:    '#faf3e8',
  creamDk:    '#e8ceaa',
  ink:        '#2e3a4e',
  slateLt:    '#8292ae',
red:        '#b84c2e',   // deep terracotta-red, warm not pink
redLight:   '#f2e0d5',   // warm parchment blush (not cold pink)
redMid:     '#dba08a',
  blue:       '#2980b9',
  blueLight:  '#eaf4fb',
  blueMid:    '#aed6f1',
  teal:       '#78938a',
  white:      '#fff',
};

interface ExtendedGameScreenProps extends GameScreenProps {
  onPlayerChange?: (player: 0 | 1) => void;
  accentColor?: string;
}

export default forwardRef(function TicTacToeGame(
  { mode, onGameEnd, onExit, showHeader = true, onPlayerChange, accentColor }: ExtendedGameScreenProps,
  ref
) {
  const [infoVisible, setInfoVisible] = useState(false);
  const { width, height } = useWindowDimensions();
  const boardSize = Math.min(width - 48, height * 0.48, 400);
  const cellSize  = boardSize / 3;

  const [state, setState]   = useState<TicState>(() => createInitialState());
  const addScore = useGameStore((s) => s.addScore);

  // Notify parent (GameScreen) whenever the player changes
  useEffect(() => {
    onPlayerChange?.(state.currentPlayer);
  }, [state.currentPlayer]);

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
    const fresh = resetState(state);
    setState(fresh);
    onPlayerChange?.(fresh.currentPlayer);
  }, [state, onPlayerChange]);

  useImperativeHandle(ref, () => ({ reset: handleReset }));

  // ── Derived colours ───────────────────────────────────────────────────────
  const isRed      = state.currentPlayer === 0;
  const activeCol  = isRed ? P.red  : P.blue;
  const activeBg   = isRed ? P.redLight : P.blueLight;
  const activeMid  = isRed ? P.redMid   : P.blueMid;

  const playerLabel = state.gameOver
    ? (state.winner === 'draw' ? 'DRAW' : `${state.winner?.toUpperCase()} WINS`)
    : `${isRed ? 'RED' : 'BLUE'}'S TURN  (${isRed ? 'X' : 'O'})`;

  const playerLabelColor = state.gameOver
    ? P.ink
    : activeCol;

  // ── Cell render ───────────────────────────────────────────────────────────
  const renderCell = (idx: number) => {
    const v     = state.board[idx];
    const isX   = v === 0;
    const isO   = v === 1;
    const isEmpty = v === null;
    const isLast  = state.lastMove === idx;

    const cellBg = isLast
      ? (isX ? P.redMid : P.blueMid)
      : isEmpty
        ? P.creamLt
        : (isX ? '#fdecea' : '#eaf4fb');

    const col = isX ? P.red : isO ? P.blue : P.slateLt;

    // Border highlight on hover-like via isLast
    return (
      <TouchableOpacity
        key={idx}
        onPress={() => handleCellPress(idx)}
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: cellBg,
            borderColor: isLast ? activeCol + 'aa' : P.creamDk,
          },
        ]}
        activeOpacity={isEmpty ? 0.7 : 1}
      >
        {!isEmpty && (
          <Text style={[styles.cellText, { color: col, fontSize: cellSize * 0.46 }]}>
            {isX ? 'X' : 'O'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: activeBg }]}>
      {/* Header */}
      {showHeader && (
        <GameHeader
          title="Tic Tac Toe"
          onBack={onExit}
          onInfo={() => setInfoVisible(true)}
          accentColor={accentColor ?? activeCol}
        />
      )}

      {/* Turn / winner banner */}
      <View style={[styles.banner, { borderColor: activeCol + '55', backgroundColor: activeCol + '18' }]}>
        <Text style={[styles.bannerText, { color: playerLabelColor }]}>
          {playerLabel}
        </Text>
      </View>

      {/* Score row */}
      <View style={styles.scoreRow}>
        <View style={[styles.scoreBox, { borderColor: P.red + '66', backgroundColor: isRed ? P.redMid : P.creamLt }]}>
          <Text style={[styles.scoreLabel, { color: P.red }]}>RED  X</Text>
          <Text style={[styles.scoreNum,   { color: P.red }]}>{state.scores[0]}</Text>
        </View>
        <View style={[styles.scoreBox, { borderColor: P.blue + '66', backgroundColor: !isRed ? P.blueMid : P.creamLt }]}>
          <Text style={[styles.scoreLabel, { color: P.blue }]}>BLUE  O</Text>
          <Text style={[styles.scoreNum,   { color: P.blue }]}>{state.scores[1]}</Text>
        </View>
      </View>

      {/* Board */}
      <View style={[styles.boardWrapper, { borderColor: activeCol + '66' }]}>
        <View style={[styles.board, { width: boardSize, height: boardSize }]}>
          {Array.from({ length: 9 }).map((_, i) => renderCell(i))}
        </View>
      </View>

      {/* Reset button */}
      <TouchableOpacity
        style={[styles.resetBtn, { backgroundColor: activeCol, shadowColor: activeCol }]}
        onPress={handleReset}
        activeOpacity={0.82}
      >
        <Text style={styles.resetBtnText}>↺  RESET</Text>
      </TouchableOpacity>

      {/* Info modal */}
      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>TIC TAC TOE</Text>
            <Text style={styles.modalBody}>
              Classic 3×3 board.{'\n\n'}
              🔴 Red plays X, goes first.{'\n'}
              🔵 Blue plays O.{'\n\n'}
              Get three in a row — horizontal, vertical, or diagonal — to win.
            </Text>
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: P.teal }]}
              onPress={() => setInfoVisible(false)}
            >
              <Text style={styles.modalCloseText}>GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 24,
  },

  banner: {
    marginTop: 18,
    marginHorizontal: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  bannerText: {
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 3,
  },

  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginHorizontal: 24,
  },
  scoreBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 2,
  },
  scoreNum: {
    fontSize: 28,
    fontWeight: '900',
  },

  boardWrapper: {
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cellText: {
    fontWeight: '900',
  },

  resetBtn: {
    marginTop: 24,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.35,
    elevation: 6,
  },
  resetBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 3,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(46,58,78,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 300,
    backgroundColor: '#faf3e8',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 3,
    color: '#2e3a4e',
    marginBottom: 14,
  },
  modalBody: {
    fontSize: 14,
    color: '#525e75',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalClose: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2.5,
  },
});