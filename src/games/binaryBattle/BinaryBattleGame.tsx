// src/games/binaryBattle/BinaryBattleGame.tsx
// CS Concept: Binary number representation & bitwise thinking
// Two players take turns converting decimal → binary by tapping bit buttons

import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, useWindowDimensions, Animated, Linking,
} from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { useGameStore } from '../../core/store';
import {
  createInitialState, submitAnswer, resetState,
  toggleBit, getCurrentInput,
  BinaryBattleState,
} from './binaryBattleLogic';
import type { GameScreenProps } from '../registry';

// ── Palette ───────────────────────────────────────────────────────────────────
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
  sage:      '#92ba92',
  amber:     '#c47b3a',
  green:     '#4a7a4a',
  white:     '#fff',
};

const YOUTUBE_URL = 'https://www.youtube.com/@YourChannel'; // 🔁 Replace with your channel

interface ExtendedProps extends GameScreenProps {
  onPlayerChange?: (p: 0 | 1) => void;
  accentColor?: string;
}

export default forwardRef(function BinaryBattleGame(
  { mode, onGameEnd, onExit, showHeader = true, onPlayerChange, accentColor }: ExtendedProps,
  ref
) {
  const [state, setState] = useState<BinaryBattleState>(() => createInitialState());
  const [infoVisible, setInfoVisible] = useState(false);
  const [resultAnim] = useState(new Animated.Value(0));
  const addScore = useGameStore((s) => s.addScore);
  const { width } = useWindowDimensions();

  const isRed   = state.currentPlayer === 0;
  const activeCol = isRed ? P.red : P.blue;
  const activeBg  = isRed ? P.redLight : P.blueLight;
  const activeMid = isRed ? P.redMid : P.blueMid;

  useEffect(() => { onPlayerChange?.(state.currentPlayer); }, [state.currentPlayer]);

  // Flash animation on answer
  const flashResult = (correct: boolean) => {
    resultAnim.setValue(0);
    Animated.sequence([
      Animated.timing(resultAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(resultAnim, { toValue: 0, duration: 400, delay: 600, useNativeDriver: true }),
    ]).start();
  };

  const handleBitToggle = useCallback((idx: number) => {
    if (state.gameOver || state.showAnswer) return;
    const current = getCurrentInput(state);
    const bits = state.currentQuestion.bits;
    const newInput = toggleBit(current, idx, bits);
    setState(s => s.currentPlayer === 0
      ? { ...s, redInput: newInput }
      : { ...s, blueInput: newInput });
  }, [state]);

  const handleSubmit = useCallback(() => {
    if (state.gameOver) return;
    const newState = submitAnswer(state);
    setState(newState);
    flashResult(newState.lastResult === 'correct');
    if (newState.lastResult === 'correct')
      addScore(state.currentPlayer === 0 ? 'red' : 'blue', 1);
    if (newState.gameOver && newState.winner) {
      setTimeout(() => onGameEnd(newState.winner!), 800);
    }
  }, [state, addScore, onGameEnd]);

  const handleReset = useCallback(() => {
    setState(resetState(state));
    onPlayerChange?.(0);
  }, [state]);

  useImperativeHandle(ref, () => ({ reset: handleReset }));

  const currentInput = getCurrentInput(state);
  const { bits, decimal } = state.currentQuestion;
  const padded = currentInput.padStart(bits, '0');

  // Result flash overlay color
  const flashBg = resultAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent',
      state.lastResult === 'correct' ? P.green + '33' : P.red + '33'],
  });

  const playerLabel = state.gameOver
    ? (state.winner === 'draw' ? 'DRAW!' : `${state.winner?.toUpperCase()} WINS!`)
    : `${isRed ? 'RED' : 'BLUE'}'S TURN`;

  return (
    <View style={[styles.container, { backgroundColor: activeBg }]}>
      {showHeader && (
        <GameHeader
          title="Binary Battle"
          onBack={onExit}
          onInfo={() => setInfoVisible(true)}
          accentColor={accentColor ?? activeCol}
        />
      )}

      {/* Turn banner */}
      <View style={[styles.banner, { borderColor: activeCol + '55', backgroundColor: activeCol + '18' }]}>
        <Text style={[styles.bannerText, { color: activeCol }]}>{playerLabel}</Text>
        <Text style={[styles.roundText, { color: P.slateLt }]}>
          ROUND {Math.min(state.round, state.maxRounds)} / {state.maxRounds}
        </Text>
      </View>

      {/* Score row */}
      <View style={styles.scoreRow}>
        <View style={[styles.scoreBox, { borderColor: P.red + '66', backgroundColor: isRed ? P.redMid : P.creamLt }]}>
          <Text style={[styles.scoreLabel, { color: P.red }]}>RED</Text>
          <Text style={[styles.scoreNum, { color: P.red }]}>{state.scores[0]}</Text>
          {state.streak[0] >= 3 && <Text style={styles.streakBadge}>🔥×{state.streak[0]}</Text>}
        </View>
        <View style={[styles.scoreBox, { borderColor: P.blue + '66', backgroundColor: !isRed ? P.blueMid : P.creamLt }]}>
          <Text style={[styles.scoreLabel, { color: P.blue }]}>BLUE</Text>
          <Text style={[styles.scoreNum, { color: P.blue }]}>{state.scores[1]}</Text>
          {state.streak[1] >= 3 && <Text style={styles.streakBadge}>🔥×{state.streak[1]}</Text>}
        </View>
      </View>

      {/* Question card */}
      <Animated.View style={[styles.questionCard, { borderColor: activeCol + '66', backgroundColor: flashBg as any }]}>
        <Text style={[styles.questionLabel, { color: P.slateLt }]}>CONVERT TO {bits}-BIT BINARY</Text>
        <Text style={[styles.decimalNum, { color: activeCol }]}>{decimal}</Text>
        <Text style={[styles.questionHint, { color: P.slateLt }]}>
          = {Math.floor(decimal / (bits === 8 ? 128 : 8))} × {bits === 8 ? 128 : 8} + …
        </Text>
      </Animated.View>

      {/* Bit toggle buttons */}
      <View style={styles.bitRow}>
        {Array.from({ length: bits }).map((_, i) => {
          const bit = padded[i];
          const isOne = bit === '1';
          const posValue = Math.pow(2, bits - 1 - i);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleBitToggle(i)}
              style={[
                styles.bitBtn,
                {
                  backgroundColor: isOne ? activeCol : P.creamLt,
                  borderColor: isOne ? activeCol : P.slateLt + '66',
                  width: bits === 8 ? (width - 80) / 8 : (width - 80) / 4 - 4,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.bitVal, { color: isOne ? P.white : P.slateLt }]}>{bit}</Text>
              <Text style={[styles.bitPos, { color: isOne ? P.white + 'aa' : P.slateLt + '88' }]}>{posValue}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Current answer display */}
      <View style={[styles.answerRow, { borderColor: activeCol + '44' }]}>
        <Text style={[styles.answerLabel, { color: P.slateLt }]}>YOUR ANSWER:</Text>
        <Text style={[styles.answerVal, { color: activeCol }]}>{padded}</Text>
      </View>

      {/* Show correct answer if wrong */}
      {state.showAnswer && (
        <View style={[styles.correctRow, { backgroundColor: P.green + '22', borderColor: P.green + '66' }]}>
          <Text style={[styles.correctLabel, { color: P.green }]}>
            CORRECT: {state.currentQuestion.correctBinary}
          </Text>
        </View>
      )}

      {/* Submit button */}
      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: activeCol, shadowColor: activeCol }]}
        onPress={handleSubmit}
        activeOpacity={0.82}
        disabled={state.gameOver}
      >
        <Text style={styles.submitBtnText}>✓  SUBMIT</Text>
      </TouchableOpacity>

      {/* YouTube learn button */}
      <TouchableOpacity
        style={[styles.ytBtn, { borderColor: P.amber + '88' }]}
        onPress={() => Linking.openURL(YOUTUBE_URL)}
        activeOpacity={0.8}
      >
        <Text style={[styles.ytBtnText, { color: P.amber }]}>▶  LEARN BINARY ON YOUTUBE</Text>
      </TouchableOpacity>

      {/* Info Modal */}
      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>BINARY BATTLE</Text>
            <Text style={styles.modalBody}>
              {'🧠 CS CONCEPT: Binary Numbers\n\n'}
              {'Each decimal number can be represented in base-2 using only 0s and 1s.\n\n'}
              {'Example:\n'}
              {'  13 = 8+4+1 = 1101 in binary\n\n'}
              {'HOW TO PLAY:\n'}
              {'• Players alternate turns\n'}
              {'• Tap the bit buttons to toggle 0 → 1\n'}
              {'• Submit your binary answer\n'}
              {'• Correct = +1 point (3-streak = +2!)\n'}
              {'• Most points after 10 rounds wins'}
            </Text>
            <TouchableOpacity
              style={[styles.ytBtnModal, { backgroundColor: P.amber }]}
              onPress={() => { setInfoVisible(false); Linking.openURL(YOUTUBE_URL); }}
            >
              <Text style={styles.ytBtnModalText}>▶  WATCH EXPLANATION</Text>
            </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingBottom: 16 },
  banner: {
    marginTop: 14, marginHorizontal: 20, paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 12, borderWidth: 1.5, alignItems: 'center', width: '90%',
  },
  bannerText: { fontWeight: '900', fontSize: 13, letterSpacing: 3 },
  roundText: { fontSize: 10, letterSpacing: 2, marginTop: 2, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', gap: 12, marginTop: 12, marginHorizontal: 20, width: '90%' },
  scoreBox: {
    flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 8,
    alignItems: 'center',
  },
  scoreLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 2 },
  scoreNum: { fontSize: 26, fontWeight: '900' },
  streakBadge: { fontSize: 10, marginTop: 2 },

  questionCard: {
    marginTop: 14, width: '90%', borderRadius: 16, borderWidth: 1.5,
    paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center',
    backgroundColor: '#faf3e8',
  },
  questionLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2.5, marginBottom: 6 },
  decimalNum: { fontSize: 52, fontWeight: '900', lineHeight: 60 },
  questionHint: { fontSize: 11, letterSpacing: 1, marginTop: 4 },

  bitRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 6, marginTop: 16, paddingHorizontal: 16,
  },
  bitBtn: {
    height: 64, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  bitVal: { fontSize: 22, fontWeight: '900' },
  bitPos: { fontSize: 8, fontWeight: '700', marginTop: 2 },

  answerRow: {
    marginTop: 12, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
    width: '90%', justifyContent: 'space-between',
  },
  answerLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  answerVal: { fontSize: 18, fontWeight: '900', letterSpacing: 4 },

  correctRow: {
    marginTop: 8, paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 10, borderWidth: 1, width: '90%', alignItems: 'center',
  },
  correctLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },

  submitBtn: {
    marginTop: 14, paddingHorizontal: 40, paddingVertical: 14,
    borderRadius: 14, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, shadowOpacity: 0.35, elevation: 6, width: '90%', alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 3 },

  ytBtn: {
    marginTop: 10, paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 10, borderWidth: 1.5, width: '90%', alignItems: 'center',
  },
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
