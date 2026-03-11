// src/games/stackAttack/StackAttackGame.tsx
// CS Concept: Stack data structure (LIFO)
// Players alternate Push/Pop operations. Trigger overflow/underflow to penalize opponent!

import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Animated, Linking,
} from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { useGameStore } from '../../core/store';
import {
  createInitialState, applyPush, applyPop, resetState,
  StackAttackState,
} from './stackAttackLogic';
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
  white:     '#fff',
};

const YOUTUBE_URL = 'https://www.youtube.com/@YourChannel'; // 🔁 Replace

interface ExtendedProps extends GameScreenProps {
  onPlayerChange?: (p: 0 | 1) => void;
  accentColor?: string;
}

export default forwardRef(function StackAttackGame(
  { mode, onGameEnd, onExit, showHeader = true, onPlayerChange, accentColor }: ExtendedProps,
  ref
) {
  const [state, setState] = useState<StackAttackState>(() => createInitialState());
  const [infoVisible, setInfoVisible] = useState(false);
  const [shakeAnim] = useState(new Animated.Value(0));
  const addScore = useGameStore((s) => s.addScore);

  const isRed   = state.currentPlayer === 0;
  const activeCol = isRed ? P.red : P.blue;
  const activeBg  = isRed ? P.redLight : P.blueLight;

  useEffect(() => { onPlayerChange?.(state.currentPlayer); }, [state.currentPlayer]);

  const shake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handlePush = useCallback(() => {
    if (state.gameOver) return;
    const newState = applyPush(state);
    setState(newState);
    if (newState.overflowTriggered) shake();
    if (newState.gameOver && newState.winner) {
      setTimeout(() => onGameEnd(newState.winner!), 600);
    }
  }, [state]);

  const handlePop = useCallback(() => {
    if (state.gameOver) return;
    const newState = applyPop(state);
    setState(newState);
    if (newState.underflowTriggered) shake();
    if (newState.gameOver && newState.winner) {
      setTimeout(() => onGameEnd(newState.winner!), 600);
    }
  }, [state]);

  const handleReset = useCallback(() => {
    setState(resetState(state));
    onPlayerChange?.(0);
  }, [state]);

  useImperativeHandle(ref, () => ({ reset: handleReset }));

  const playerLabel = state.gameOver
    ? (state.winner === 'draw' ? 'DRAW!' : `${state.winner?.toUpperCase()} WINS!`)
    : `${isRed ? 'RED' : 'BLUE'}'S TURN`;

  const stackFull = state.stack.length >= state.maxStackSize;
  const stackEmpty = state.stack.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: activeBg }]}>
      {showHeader && (
        <GameHeader
          title="Stack Attack"
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
        </View>
        <View style={[styles.scoreBox, { borderColor: P.blue + '66', backgroundColor: !isRed ? P.blueMid : P.creamLt }]}>
          <Text style={[styles.scoreLabel, { color: P.blue }]}>BLUE</Text>
          <Text style={[styles.scoreNum, { color: P.blue }]}>{state.scores[1]}</Text>
        </View>
      </View>

      {/* Stack visualizer */}
      <Animated.View style={[styles.stackContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <View style={styles.stackHeader}>
          <Text style={[styles.stackTitle, { color: P.slateLt }]}>
            STACK  [{state.stack.length}/{state.maxStackSize}]
          </Text>
          {stackFull && <Text style={styles.warningTag}>⚠ FULL</Text>}
          {stackEmpty && <Text style={styles.warningTag}>EMPTY</Text>}
        </View>

        {/* Stack items — top of stack = last item */}
        <View style={styles.stackVisual}>
          {/* Empty slots */}
          {Array.from({ length: state.maxStackSize }).map((_, i) => {
            const stackIdx = state.maxStackSize - 1 - i; // 5 down to 0
            const item = state.stack[stackIdx];
            const isTop = stackIdx === state.stack.length - 1 && item;
            return (
              <View
                key={i}
                style={[
                  styles.stackSlot,
                  item ? {
                    backgroundColor: item.owner === 0 ? P.redMid : P.blueMid,
                    borderColor: item.owner === 0 ? P.red + '88' : P.blue + '88',
                  } : {
                    backgroundColor: P.creamLt,
                    borderColor: P.creamDk,
                  },
                  isTop && styles.stackSlotTop,
                ]}
              >
                {item ? (
                  <>
                    <Text style={[styles.stackItemVal, { color: item.owner === 0 ? P.red : P.blue }]}>
                      {item.value}
                    </Text>
                    {isTop && <Text style={styles.topLabel}>← TOP</Text>}
                  </>
                ) : (
                  <Text style={styles.emptySlot}>—</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Stack base */}
        <View style={[styles.stackBase, { backgroundColor: P.ink }]}>
          <Text style={styles.stackBaseText}>▬ BASE ▬</Text>
        </View>
      </Animated.View>

      {/* Next push value preview */}
      <View style={[styles.previewRow, { borderColor: activeCol + '44' }]}>
        <Text style={[styles.previewLabel, { color: P.slateLt }]}>NEXT PUSH VALUE:</Text>
        <Text style={[styles.previewVal, { color: activeCol }]}>{state.nextPushValue}</Text>
      </View>

      {/* Message */}
      <View style={[styles.msgBox, {
        backgroundColor: state.overflowTriggered || state.underflowTriggered
          ? P.red + '22' : activeCol + '11',
        borderColor: state.overflowTriggered || state.underflowTriggered
          ? P.red + '55' : activeCol + '33',
      }]}>
        <Text style={[styles.msgText, {
          color: state.overflowTriggered || state.underflowTriggered ? P.red : P.ink,
        }]}>
          {state.message}
        </Text>
      </View>

      {/* Push / Pop buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: activeCol, shadowColor: activeCol, opacity: stackFull ? 0.5 : 1 }]}
          onPress={handlePush}
          activeOpacity={0.82}
          disabled={state.gameOver}
        >
          <Text style={styles.actionBtnText}>⬆ PUSH</Text>
          <Text style={styles.actionBtnSub}>{state.nextPushValue}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: P.teal, shadowColor: P.teal, opacity: stackEmpty ? 0.5 : 1 }]}
          onPress={handlePop}
          activeOpacity={0.82}
          disabled={state.gameOver}
        >
          <Text style={styles.actionBtnText}>⬇ POP</Text>
          <Text style={styles.actionBtnSub}>
            {state.stack.length > 0 ? state.stack[state.stack.length - 1].value : '—'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* YouTube */}
      <TouchableOpacity
        style={[styles.ytBtn, { borderColor: P.amber + '88' }]}
        onPress={() => Linking.openURL(YOUTUBE_URL)}
        activeOpacity={0.8}
      >
        <Text style={[styles.ytBtnText, { color: P.amber }]}>▶  LEARN STACKS ON YOUTUBE</Text>
      </TouchableOpacity>

      {/* Info Modal */}
      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>STACK ATTACK</Text>
            <Text style={styles.modalBody}>
              {'🧠 CS CONCEPT: Stack (LIFO)\n\n'}
              {'A stack is Last-In-First-Out.\nOnly the TOP element can be accessed.\n\n'}
              {'RULES:\n'}
              {'• PUSH adds a value to the top\n'}
              {'• POP removes the top value\n'}
              {'• Pop YOUR OWN items = +1 point\n'}
              {'• Overflow (push when full) = -1\n'}
              {'• Underflow (pop when empty) = -1\n'}
              {'• Most points after 12 rounds wins!\n\n'}
              {'STRATEGY: Force your opponent into overflow/underflow!'}
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
  container: { flex: 1, alignItems: 'center', paddingBottom: 16 },
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

  stackContainer: { marginTop: 14, width: '90%', alignItems: 'center' },
  stackHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4 },
  stackTitle: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  warningTag: { fontSize: 9, fontWeight: '900', color: '#b84c2e', letterSpacing: 1 },

  stackVisual: { width: '100%', gap: 3 },
  stackSlot: {
    width: '100%', height: 38, borderRadius: 8, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  stackSlotTop: { borderWidth: 2.5 },
  stackItemVal: { fontSize: 18, fontWeight: '900' },
  topLabel: { fontSize: 9, fontWeight: '700', color: '#8292ae', letterSpacing: 1 },
  emptySlot: { color: '#8292ae', fontSize: 14 },
  stackBase: { width: '100%', height: 10, borderRadius: 4, marginTop: 3, alignItems: 'center', justifyContent: 'center' },
  stackBaseText: { color: '#fff', fontSize: 7, fontWeight: '900', letterSpacing: 2 },

  previewRow: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 6, width: '90%',
  },
  previewLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  previewVal: { fontSize: 22, fontWeight: '900' },

  msgBox: {
    marginTop: 8, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, width: '90%',
  },
  msgText: { fontSize: 11, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5 },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12, width: '90%' },
  actionBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, shadowOpacity: 0.35, elevation: 6,
  },
  actionBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 2 },
  actionBtnSub: { color: '#ffffffaa', fontWeight: '700', fontSize: 18, marginTop: 2 },

  ytBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, width: '90%', alignItems: 'center' },
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
