// src/games/sortWars/SortWarsGame.tsx
// CS Concept: Bubble Sort — tap adjacent elements to swap them into sorted order

import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Linking, useWindowDimensions,
} from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { useGameStore } from '../../core/store';
import {
  createInitialState, selectCell, resetState,
  SortWarsState,
} from './sortWarsLogic';
import type { GameScreenProps } from '../registry';

const P = {
  creamLt:   '#faf3e8',
  creamDk:   '#e8ceaa',
  ink:       '#2e3a4e',
  slateLt:   '#8292ae',
  red:       '#b84c2e',
  redLight:  '#f2e0d5',
  redMid:    '#dba08a',
  blue:      '#2980b9',
  blueLight: '#eaf4fb',
  blueMid:   '#aed6f1',
  teal:      '#78938a',
  amber:     '#c47b3a',
  green:     '#4a7a4a',
  greenLight:'#d5ead5',
  white:     '#fff',
};

const YOUTUBE_URL = 'https://www.youtube.com/@YourChannel'; // 🔁 Replace

interface ExtendedProps extends GameScreenProps {
  onPlayerChange?: (p: 0 | 1) => void;
  accentColor?: string;
}

export default forwardRef(function SortWarsGame(
  { mode, onGameEnd, onExit, showHeader = true, onPlayerChange, accentColor }: ExtendedProps,
  ref
) {
  const [state, setState] = useState<SortWarsState>(() => createInitialState());
  const [infoVisible, setInfoVisible] = useState(false);
  const addScore = useGameStore((s) => s.addScore);
  const { width } = useWindowDimensions();

  const isRed   = state.currentPlayer === 0;
  const activeCol = isRed ? P.red : P.blue;
  const activeBg  = isRed ? P.redLight : P.blueLight;
  const activeMid = isRed ? P.redMid : P.blueMid;

  useEffect(() => { onPlayerChange?.(state.currentPlayer); }, [state.currentPlayer]);

  const handleCellPress = useCallback((idx: number) => {
    if (state.gameOver) return;
    const newState = selectCell(state, idx);
    setState(newState);
    if (newState.gameOver && newState.winner) {
      if (newState.winner !== 'draw') addScore(newState.winner, 1);
      setTimeout(() => onGameEnd(newState.winner!), 600);
    }
  }, [state, addScore, onGameEnd]);

  const handleReset = useCallback(() => {
    setState(resetState(state));
    onPlayerChange?.(0);
  }, [state]);

  useImperativeHandle(ref, () => ({ reset: handleReset }));

  const playerLabel = state.gameOver
    ? (state.winner === 'draw' ? 'DRAW!' : `${state.winner?.toUpperCase()} WINS!`)
    : `${isRed ? 'RED' : 'BLUE'}'S TURN`;

  // Cell dimensions
  const cellW = Math.min((width - 52) / state.array.length, 52);
  const maxVal = Math.max(...state.array);

  return (
    <View style={[styles.container, { backgroundColor: activeBg }]}>
      {showHeader && (
        <GameHeader
          title="Sort Wars"
          onBack={onExit}
          onInfo={() => setInfoVisible(true)}
          accentColor={accentColor ?? activeCol}
        />
      )}

      {/* Banner */}
      <View style={[styles.banner, { borderColor: activeCol + '55', backgroundColor: activeCol + '18' }]}>
        <Text style={[styles.bannerText, { color: activeCol }]}>{playerLabel}</Text>
        <Text style={[styles.roundText, { color: P.slateLt }]}>
          ROUND {Math.min(state.round, state.maxRounds)} / {state.maxRounds}
        </Text>
      </View>

      {/* Scores */}
      <View style={styles.scoreRow}>
        <View style={[styles.scoreBox, { borderColor: P.red + '66', backgroundColor: isRed ? P.redMid : P.creamLt }]}>
          <Text style={[styles.scoreLabel, { color: P.red }]}>RED</Text>
          <Text style={[styles.scoreNum, { color: P.red }]}>{state.scores[0]}</Text>
          <Text style={[styles.scoreSubLabel, { color: P.red + 'aa' }]}>{state.swapCount[0]} swaps</Text>
        </View>
        <View style={[styles.scoreBox, { borderColor: P.blue + '66', backgroundColor: !isRed ? P.blueMid : P.creamLt }]}>
          <Text style={[styles.scoreLabel, { color: P.blue }]}>BLUE</Text>
          <Text style={[styles.scoreNum, { color: P.blue }]}>{state.scores[1]}</Text>
          <Text style={[styles.scoreSubLabel, { color: P.blue + 'aa' }]}>{state.swapCount[1]} swaps</Text>
        </View>
      </View>

      {/* Bar chart visualizer */}
      <View style={styles.barChartContainer}>
        <Text style={[styles.chartLabel, { color: P.slateLt }]}>ARRAY STATE</Text>
        <View style={styles.barChart}>
          {state.array.map((val, i) => {
            const isSorted = state.sortedPositions.includes(i);
            const isSelected = state.selectedIdx === i;
            const isLastSwap = state.lastSwap && (state.lastSwap[0] === i || state.lastSwap[1] === i);
            const barH = (val / maxVal) * 100;

            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleCellPress(i)}
                style={styles.barWrapper}
                activeOpacity={0.75}
              >
                {/* Bar */}
                <View
                  style={[
                    styles.bar,
                    {
                      height: barH,
                      width: cellW - 6,
                      backgroundColor: isSorted
                        ? P.green
                        : isSelected
                          ? activeCol
                          : isLastSwap
                            ? activeMid
                            : P.slateLt + 'aa',
                      borderColor: isSelected ? activeCol : 'transparent',
                      borderWidth: isSelected ? 2 : 0,
                    },
                  ]}
                />
                {/* Value below */}
                <Text style={[
                  styles.barVal,
                  {
                    color: isSorted ? P.green : isSelected ? activeCol : P.ink,
                    fontWeight: isSelected ? '900' : '700',
                  },
                ]}>
                  {val}
                </Text>
                {/* Index */}
                <Text style={[styles.barIdx, { color: P.slateLt }]}>{i + 1}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Sorted progress bar */}
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: P.slateLt }]}>SORTED:</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {
              width: `${(state.sortedPositions.length / state.array.length) * 100}%`,
              backgroundColor: P.green,
            }]} />
          </View>
          <Text style={[styles.progressPct, { color: P.green }]}>
            {Math.round((state.sortedPositions.length / state.array.length) * 100)}%
          </Text>
        </View>
      </View>

      {/* Message */}
      <View style={[styles.msgBox, { backgroundColor: activeCol + '11', borderColor: activeCol + '33' }]}>
        <Text style={[styles.msgText, { color: P.ink }]}>{state.message}</Text>
      </View>

      {/* Hint */}
      {state.selectedIdx !== null && (
        <View style={styles.hintRow}>
          {state.array.map((_, i) => {
            const isAdjacent = Math.abs(i - state.selectedIdx!) === 1;
            if (!isAdjacent) return null;
            return (
              <Text key={i} style={[styles.hintText, { color: activeCol }]}>
                Tap position {i + 1} to swap ↔
              </Text>
            );
          })}
        </View>
      )}

      {/* Reset */}
      <TouchableOpacity
        style={[styles.resetBtn, { backgroundColor: activeCol, shadowColor: activeCol }]}
        onPress={handleReset}
        activeOpacity={0.82}
      >
        <Text style={styles.resetBtnText}>↺  RESET</Text>
      </TouchableOpacity>

      {/* YouTube */}
      <TouchableOpacity
        style={[styles.ytBtn, { borderColor: P.amber + '88' }]}
        onPress={() => Linking.openURL(YOUTUBE_URL)}
        activeOpacity={0.8}
      >
        <Text style={[styles.ytBtnText, { color: P.amber }]}>▶  LEARN BUBBLE SORT ON YOUTUBE</Text>
      </TouchableOpacity>

      {/* Info Modal */}
      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>SORT WARS</Text>
            <Text style={styles.modalBody}>
              {'🧠 CS CONCEPT: Bubble Sort\n\n'}
              {'Bubble sort works by repeatedly swapping adjacent elements that are in the wrong order.\n\n'}
              {'HOW TO PLAY:\n'}
              {'• Tap any element, then tap an adjacent one to swap\n'}
              {'• GOOD swap (smaller left) = +1 point\n'}
              {'• Bad swap = 0 points\n'}
              {'• Green = already in correct position\n'}
              {'• Array sorted OR 20 rounds → game ends\n'}
              {'• Most points wins!'}
            </Text>
            <TouchableOpacity
              style={[styles.ytBtnModal, { backgroundColor: P.amber }]}
              onPress={() => { setInfoVisible(false); Linking.openURL(YOUTUBE_URL); }}
            >
              <Text style={styles.ytBtnModalText}>▶  WATCH EXPLANATION</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: P.teal }]} onPress={() => setInfoVisible(false)}>
              <Text style={styles.modalCloseText}>GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingBottom: 12 },
  banner: {
    marginTop: 14, marginHorizontal: 20, paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 12, borderWidth: 1.5, alignItems: 'center', width: '90%',
  },
  bannerText: { fontWeight: '900', fontSize: 13, letterSpacing: 3 },
  roundText: { fontSize: 10, letterSpacing: 2, marginTop: 2, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', gap: 12, marginTop: 10, width: '90%' },
  scoreBox: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 8, alignItems: 'center' },
  scoreLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  scoreNum: { fontSize: 26, fontWeight: '900' },
  scoreSubLabel: { fontSize: 9, fontWeight: '700', marginTop: 2 },

  barChartContainer: {
    marginTop: 14, width: '92%',
    backgroundColor: '#faf3e8', borderRadius: 16,
    borderWidth: 1.5, borderColor: '#e8ceaa',
    padding: 14,
  },
  chartLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2.5, marginBottom: 10, textAlign: 'center' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 2 },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { borderRadius: 4, marginBottom: 4 },
  barVal: { fontSize: 11, textAlign: 'center' },
  barIdx: { fontSize: 8, textAlign: 'center', marginTop: 1 },

  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  progressLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1.5, width: 52 },
  progressTrack: { flex: 1, height: 6, backgroundColor: '#e8ceaa', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressPct: { fontSize: 9, fontWeight: '900', width: 32, textAlign: 'right' },

  msgBox: {
    marginTop: 10, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, width: '90%',
  },
  msgText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  hintRow: { marginTop: 4, alignItems: 'center' },
  hintText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  resetBtn: {
    marginTop: 12, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 14,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, shadowOpacity: 0.35, elevation: 6,
    width: '90%', alignItems: 'center',
  },
  resetBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 3 },

  ytBtn: { marginTop: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, width: '90%', alignItems: 'center' },
  ytBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(46,58,78,0.72)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 320, backgroundColor: '#faf3e8', borderRadius: 20, padding: 28, alignItems: 'center' },
  modalTitle: { fontWeight: '900', fontSize: 18, letterSpacing: 3, color: '#2e3a4e', marginBottom: 14 },
  modalBody: { fontSize: 13, color: '#525e75', textAlign: 'left', lineHeight: 21, marginBottom: 16, width: '100%' },
  ytBtnModal: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginBottom: 10, width: '100%', alignItems: 'center' },
  ytBtnModalText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  modalClose: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalCloseText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
});
