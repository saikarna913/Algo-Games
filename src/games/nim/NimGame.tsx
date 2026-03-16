// src/games/nim/NimGame.tsx
// CS Concept: Nim — XOR / Sprague-Grundy Theorem
// Pebbles in buckets visualisation with live XOR display

import React, {
  useState, useCallback, forwardRef,
  useImperativeHandle, useEffect, useRef,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Animated, Linking,
  useWindowDimensions,
} from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { useGameStore } from '../../core/store';
import {
  createInitialState, selectPile, setRemoveCount,
  confirmMove, toggleHint, resetState,
  computeXor, xorBreakdown, toBinary, PRESETS,
  NimState,
} from './nimLogic';
import type { GameScreenProps } from '../registry';

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  creamLt:   '#faf3e8',
  creamDk:   '#e8ceaa',
  creamMd:   '#f1ddbf',
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
  greenLt:   '#d5ead5',
  white:     '#fff',
  pebble:    '#d4cbb8',   // natural pebble colour
  pebbleDk:  '#b8ad98',
  bucket:    '#8a7560',
};

const YOUTUBE_URL = 'https://www.youtube.com/@DrukenCoder';

interface ExtendedProps extends GameScreenProps {
  onPlayerChange?: (p: 0 | 1) => void;
  accentColor?: string;
}

// ─── Single Pebble ────────────────────────────────────────────────────────────
function Pebble({
  size = 18,
  removed = false,
  highlight = false,
  owner,
}: {
  size?: number;
  removed?: boolean;
  highlight?: boolean;
  owner?: 'red' | 'blue' | null;
}) {
  const bg = removed
    ? 'transparent'
    : highlight
      ? (owner === 'red' ? P.redMid : P.blueMid)
      : P.pebble;
  const border = removed ? P.creamDk + '55' : highlight ? (owner === 'red' ? P.red : P.blue) : P.pebbleDk;

  return (
    <View style={{
      width: size,
      height: size * 0.85,
      borderRadius: size * 0.42,
      backgroundColor: bg,
      borderWidth: removed ? 1 : 1.5,
      borderColor: border,
      borderStyle: removed ? 'dashed' : 'solid',
      marginHorizontal: 2,
      marginVertical: 2,
      shadowColor: removed ? 'transparent' : '#00000033',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: removed ? 0 : 0.25,
      shadowRadius: 2,
      elevation: removed ? 0 : 2,
      // Slight inner highlight
      overflow: 'hidden',
    }}>
      {!removed && (
        <View style={{
          position: 'absolute', top: 3, left: 4,
          width: size * 0.3, height: size * 0.2,
          borderRadius: size * 0.1,
          backgroundColor: '#ffffff55',
        }} />
      )}
    </View>
  );
}

// ─── Bucket / Pile ────────────────────────────────────────────────────────────
function PileView({
  pileIdx,
  count,
  maxCount,
  selected,
  removeCount,
  isLastMove,
  lastRemoved,
  onPress,
  disabled,
  currentPlayer,
  hintPile,
}: {
  pileIdx: number;
  count: number;
  maxCount: number;
  selected: boolean;
  removeCount: number;
  isLastMove: boolean;
  lastRemoved: number;
  onPress: () => void;
  disabled: boolean;
  currentPlayer: Player;
  hintPile: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activeCol = currentPlayer === 0 ? P.red : P.blue;

  const pressIn  = () => Animated.spring(scaleAnim, { toValue: 0.94, speed: 80, bounciness: 2, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1,    speed: 30, bounciness: 8, useNativeDriver: true }).start();

  // Show which pebbles are "about to be removed" (top ones)
  const toRemove = selected ? removeCount : 0;
  const remaining = count - toRemove;

  // Grid layout — max 5 per row
  const cols = Math.min(count <= 5 ? count : Math.ceil(Math.sqrt(maxCount)), 5);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        disabled={disabled || count === 0}
        style={[
          styles.bucket,
          selected && { borderColor: activeCol, borderWidth: 2.5, backgroundColor: activeCol + '10' },
          hintPile && !selected && { borderColor: P.amber + 'cc', borderWidth: 2 },
          count === 0 && styles.bucketEmpty,
        ]}
      >
        {/* Bucket label */}
        <View style={[styles.bucketLabel, { backgroundColor: selected ? activeCol : hintPile ? P.amber : P.bucket }]}>
          <Text style={styles.bucketLabelText}>P{pileIdx + 1}</Text>
          <Text style={styles.bucketCount}>{count}</Text>
        </View>

        {/* Pebbles grid */}
        <View style={styles.pebblesGrid}>
          {count === 0 ? (
            <Text style={styles.emptyText}>empty</Text>
          ) : (
            Array.from({ length: count }).map((_, i) => {
              // pebbles are shown bottom→top; top ones get removed first
              const pebblePos = i; // 0 = first placed, count-1 = top
              const willBeRemoved = selected && pebblePos >= remaining;
              return (
                <Pebble
                  key={i}
                  size={count > 8 ? 14 : 18}
                  removed={willBeRemoved}
                  highlight={isLastMove && i >= count - lastRemoved + (willBeRemoved ? 0 : 0)}
                  owner={currentPlayer === 0 ? 'red' : 'blue'}
                />
              );
            })
          )}
        </View>

        {/* XOR value badge on bucket */}
        <View style={[styles.xorBadge, { backgroundColor: P.creamDk }]}>
          <Text style={[styles.xorBadgeText, { color: P.ink }]}>{count}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

type Player = 0 | 1;

// ─── XOR Visualiser ──────────────────────────────────────────────────────────
function XorPanel({ state }: { state: NimState }) {
  const xorCol = state.xorValue === 0 ? P.red : P.green;
  const binaryWidth = Math.max(...state.piles, state.xorValue).toString(2).length + 1;

  return (
    <View style={styles.xorPanel}>
      <Text style={[styles.xorTitle, { color: P.slateLt }]}>NIM-SUM  (XOR)</Text>

      {/* Binary breakdown table */}
      <View style={styles.xorTable}>
        {state.piles.map((p, i) => (
          <View key={i} style={styles.xorRow}>
            <Text style={[styles.xorRowLabel, { color: P.slateLt }]}>P{i + 1} = {p}</Text>
            <Text style={[styles.xorBinary, { color: P.ink }]}>
              {toBinary(p, binaryWidth)}
            </Text>
          </View>
        ))}
        {/* Divider */}
        <View style={[styles.xorDivider, { backgroundColor: P.slateLt + '55' }]} />
        <View style={styles.xorRow}>
          <Text style={[styles.xorRowLabel, { color: xorCol, fontWeight: '900' }]}>XOR</Text>
          <Text style={[styles.xorBinary, { color: xorCol, fontWeight: '900' }]}>
            {toBinary(state.xorValue, binaryWidth)}  = {state.xorValue}
          </Text>
        </View>
      </View>

      {/* Status */}
      <View style={[styles.xorStatus, { backgroundColor: xorCol + '18', borderColor: xorCol + '66' }]}>
        <Text style={[styles.xorStatusText, { color: xorCol }]}>
          {state.xorValue === 0
            ? '⚠ XOR = 0 → LOSING position for current player'
            : `✓ XOR = ${state.xorValue} → WINNING position`}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Game ────────────────────────────────────────────────────────────────
export default forwardRef(function NimGame(
  { mode, onGameEnd, onExit, showHeader = true, onPlayerChange, accentColor }: ExtendedProps,
  ref
) {
  const [state, setState] = useState<NimState>(() => createInitialState());
  const [infoVisible, setInfoVisible] = useState(false);
  const [presetVisible, setPresetVisible] = useState(false);
  const addScore = useGameStore((s) => s.addScore);
  const { width } = useWindowDimensions();

  const isRed     = state.currentPlayer === 0;
  const activeCol = isRed ? P.red  : P.blue;
  const activeBg  = isRed ? P.redLight : P.blueLight;

  useEffect(() => { onPlayerChange?.(state.currentPlayer); }, [state.currentPlayer]);

  const handlePilePress = useCallback((idx: number) => {
    if (state.gameOver) return;
    if (state.selectedPile === idx) {
      // deselect
      setState(s => ({ ...s, selectedPile: null, selectedRemove: 1 }));
    } else {
      setState(s => selectPile(s, idx));
    }
  }, [state]);

  const handleRemoveAdjust = useCallback((delta: number) => {
    setState(s => setRemoveCount(s, s.selectedRemove + delta));
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.selectedPile === null) return;
    const newState = confirmMove(state);
    setState(newState);
    if (newState.gameOver && newState.winner) {
      addScore(newState.winner, 1);
      setTimeout(() => onGameEnd(newState.winner!), 700);
    }
  }, [state, addScore, onGameEnd]);

  const handleReset = useCallback((piles?: number[]) => {
    setState(resetState(piles ?? state.originalPiles));
    onPlayerChange?.(0);
  }, [state.originalPiles]);

  useImperativeHandle(ref, () => ({ reset: () => handleReset() }));

  const playerLabel = state.gameOver
    ? `${state.winner?.toUpperCase()} WINS!`
    : `${isRed ? 'RED' : 'BLUE'}'S TURN`;

  const hintPileIdx = state.hintMove?.pile ?? -1;
  const maxPile = Math.max(...state.piles, 1);

  return (
    <View style={[styles.container, { backgroundColor: activeBg }]}>
      {showHeader && (
        <GameHeader
          title="Nim"
          onBack={onExit}
          onInfo={() => setInfoVisible(true)}
          accentColor={accentColor ?? activeCol}
        />
      )}

      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Turn banner */}
        <View style={[styles.banner, { borderColor: activeCol + '55', backgroundColor: activeCol + '18' }]}>
          <Text style={[styles.bannerText, { color: activeCol }]}>{playerLabel}</Text>
          <Text style={[styles.moveCount, { color: P.slateLt }]}>MOVE {state.moveCount + 1}</Text>
        </View>

        {/* Scores */}
        <View style={styles.scoreRow}>
          <View style={[styles.scoreBox, { borderColor: P.red + '66', backgroundColor: isRed ? P.redMid : P.creamLt }]}>
            <Text style={[styles.scoreLabel, { color: P.red }]}>RED</Text>
            <Text style={[styles.scoreNum, { color: P.red }]}>{state.scores[0]}</Text>
          </View>
          <TouchableOpacity
            style={[styles.hintBtn, { borderColor: P.amber + '88', backgroundColor: state.showHint ? P.amber + '22' : P.creamLt }]}
            onPress={() => setState(s => toggleHint(s))}
          >
            <Text style={[styles.hintBtnText, { color: P.amber }]}>
              {state.showHint ? '▼ XOR' : '▶ XOR'}
            </Text>
          </TouchableOpacity>
          <View style={[styles.scoreBox, { borderColor: P.blue + '66', backgroundColor: !isRed ? P.blueMid : P.creamLt }]}>
            <Text style={[styles.scoreLabel, { color: P.blue }]}>BLUE</Text>
            <Text style={[styles.scoreNum, { color: P.blue }]}>{state.scores[1]}</Text>
          </View>
        </View>

        {/* XOR Panel (collapsible) */}
        {state.showHint && <XorPanel state={state} />}

        {/* ── BUCKETS / PILES ─────────────────────────────────────────────── */}
        <View style={styles.bucketsRow}>
          {state.piles.map((count, idx) => (
            <PileView
              key={idx}
              pileIdx={idx}
              count={count}
              maxCount={maxPile}
              selected={state.selectedPile === idx}
              removeCount={state.selectedRemove}
              isLastMove={state.lastMove?.pile === idx}
              lastRemoved={state.lastMove?.pile === idx ? state.lastMove.removed : 0}
              onPress={() => handlePilePress(idx)}
              disabled={state.gameOver}
              currentPlayer={state.currentPlayer}
              hintPile={state.showHint && idx === hintPileIdx}
            />
          ))}
        </View>

        {/* Remove control — only when pile selected */}
        {state.selectedPile !== null && !state.gameOver && (
          <View style={[styles.removeControl, { borderColor: activeCol + '55', backgroundColor: activeCol + '0d' }]}>
            <Text style={[styles.removeLabel, { color: P.slateLt }]}>
              REMOVE FROM PILE {state.selectedPile + 1}
            </Text>
            <View style={styles.removeCounter}>
              <TouchableOpacity
                style={[styles.counterBtn, { borderColor: activeCol + '88' }]}
                onPress={() => handleRemoveAdjust(-1)}
                disabled={state.selectedRemove <= 1}
              >
                <Text style={[styles.counterBtnText, { color: activeCol, opacity: state.selectedRemove <= 1 ? 0.3 : 1 }]}>−</Text>
              </TouchableOpacity>

              <View style={[styles.counterVal, { borderColor: activeCol + '55' }]}>
                <Text style={[styles.counterValText, { color: activeCol }]}>{state.selectedRemove}</Text>
              </View>

              <TouchableOpacity
                style={[styles.counterBtn, { borderColor: activeCol + '88' }]}
                onPress={() => handleRemoveAdjust(1)}
                disabled={state.selectedRemove >= (state.piles[state.selectedPile] ?? 0)}
              >
                <Text style={[styles.counterBtnText, {
                  color: activeCol,
                  opacity: state.selectedRemove >= (state.piles[state.selectedPile] ?? 0) ? 0.3 : 1,
                }]}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: activeCol, shadowColor: activeCol }]}
              onPress={handleConfirm}
              activeOpacity={0.82}
            >
              <Text style={styles.confirmBtnText}>
                ✓  REMOVE {state.selectedRemove} STONE{state.selectedRemove > 1 ? 'S' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hint move */}
        {state.showHint && state.hintMove && !state.gameOver && (
          <View style={[styles.hintBox, { borderColor: P.amber + '88', backgroundColor: P.amber + '11' }]}>
            <Text style={[styles.hintBoxText, { color: P.amber }]}>
              💡 Optimal: Remove {state.piles[state.hintMove.pile] - state.hintMove.to} from Pile {state.hintMove.pile + 1}
              {'  →  '}XOR becomes 0
            </Text>
          </View>
        )}

        {/* Message bar */}
        <View style={[styles.msgBox, { backgroundColor: activeCol + '11', borderColor: activeCol + '33' }]}>
          <Text style={[styles.msgText, { color: P.ink }]}>{state.message}</Text>
        </View>

        {/* Action row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: activeCol, shadowColor: activeCol }]}
            onPress={() => handleReset()}
            activeOpacity={0.82}
          >
            <Text style={styles.resetBtnText}>↺  RESET</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.presetBtn, { borderColor: P.teal + '88' }]}
            onPress={() => setPresetVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.presetBtnText, { color: P.teal }]}>⚙  PRESETS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ytBtn, { borderColor: P.amber + '88' }]}
            onPress={() => Linking.openURL(YOUTUBE_URL)}
            activeOpacity={0.8}
          >
            <Text style={[styles.ytBtnText, { color: P.amber }]}>▶  YT</Text>
          </TouchableOpacity>
        </View>

        {/* XOR History sparkline */}
        {state.xorHistory.length > 1 && (
          <View style={styles.historyPanel}>
            <Text style={[styles.historyLabel, { color: P.slateLt }]}>XOR HISTORY</Text>
            <View style={styles.historyRow}>
              {state.xorHistory.map((xv, i) => (
                <View key={i} style={styles.historyItem}>
                  <View style={[styles.historyBar, {
                    height: Math.max(4, (xv / Math.max(...state.xorHistory, 1)) * 32),
                    backgroundColor: xv === 0 ? P.red + 'bb' : P.green + 'bb',
                  }]} />
                  <Text style={[styles.historyVal, { color: xv === 0 ? P.red : P.green }]}>{xv}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Preset Modal ───────────────────────────────────────────────────── */}
      <Modal transparent visible={presetVisible} animationType="fade" onRequestClose={() => setPresetVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>CHOOSE PILES</Text>
            {PRESETS.map((preset, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.presetItem, { borderColor: P.teal + '55' }]}
                onPress={() => { setPresetVisible(false); handleReset(preset.piles); }}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.presetItemLabel, { color: P.ink }]}>{preset.label}</Text>
                  <Text style={[styles.presetItemDesc, { color: P.slateLt }]}>{preset.description}</Text>
                </View>
                <Text style={[styles.presetPiles, { color: P.teal }]}>
                  [{preset.piles.join(', ')}]
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: P.teal }]} onPress={() => setPresetVisible(false)}>
              <Text style={styles.modalCloseText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Info Modal ─────────────────────────────────────────────────────── */}
      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>NIM</Text>
            <Text style={styles.modalBody}>
              {'🧠 CS CONCEPT: XOR / Sprague-Grundy\n\n'}
              {'RULES:\n'}
              {'• Multiple piles of stones\n'}
              {'• On your turn: remove any number from ONE pile\n'}
              {'• Player who takes the LAST stone wins\n\n'}
              {'THE XOR TRICK:\n'}
              {'Compute:  P1 ⊕ P2 ⊕ P3 ... = Nim-Sum\n'}
              {'• Nim-Sum = 0 → you LOSE (opponent plays perfectly)\n'}
              {'• Nim-Sum ≠ 0 → you WIN (make Nim-Sum = 0)\n\n'}
              {'Example: 3 ⊕ 4 ⊕ 5 = 2 ≠ 0 → first player wins!\n\n'}
              {'Tap ▶ XOR to see the binary breakdown live.'}
            </Text>
            <TouchableOpacity
              style={[styles.ytBtnModal, { backgroundColor: P.amber }]}
              onPress={() => { setInfoVisible(false); Linking.openURL(YOUTUBE_URL); }}
            >
              <Text style={styles.ytBtnModalText}>▶  WATCH ON YOUTUBE</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: 32, paddingHorizontal: 16 },

  banner: {
    marginTop: 14, paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 12, borderWidth: 1.5, alignItems: 'center', width: '100%',
  },
  bannerText: { fontWeight: '900', fontSize: 13, letterSpacing: 3 },
  moveCount:  { fontSize: 9, letterSpacing: 2, marginTop: 2, fontWeight: '700' },

  scoreRow: { flexDirection: 'row', gap: 10, marginTop: 10, width: '100%', alignItems: 'center' },
  scoreBox: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 8, alignItems: 'center' },
  scoreLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  scoreNum:   { fontSize: 24, fontWeight: '900' },
  hintBtn: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center',
  },
  hintBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },

  // ── XOR Panel ──────────────────────────────────────────────────────────────
  xorPanel: {
    marginTop: 10, width: '100%', backgroundColor: P.creamLt,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#e8ceaa', padding: 14,
  },
  xorTitle: { fontSize: 8, fontWeight: '900', letterSpacing: 2.5, marginBottom: 10, textAlign: 'center' },
  xorTable: { gap: 4 },
  xorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xorRowLabel: { fontSize: 11, fontWeight: '700', width: 70 },
  xorBinary: { fontSize: 14, fontFamily: 'monospace', letterSpacing: 3 },
  xorDivider: { height: 1.5, marginVertical: 6, borderRadius: 1 },
  xorStatus: {
    marginTop: 10, paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1,
  },
  xorStatusText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // ── Buckets ────────────────────────────────────────────────────────────────
  bucketsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 12, marginTop: 16, width: '100%',
  },
  bucket: {
    minWidth: 80, maxWidth: 110,
    backgroundColor: P.creamLt,
    borderRadius: 16, borderWidth: 1.5,
    borderColor: '#c8b89a',
    padding: 10,
    alignItems: 'center',
    shadowColor: '#2e3a4e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bucketEmpty: { opacity: 0.45 },
  bucketLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, marginBottom: 8,
  },
  bucketLabelText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, color: P.white },
  bucketCount: { fontSize: 14, fontWeight: '900', color: P.white },
  pebblesGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', minHeight: 24,
  },
  emptyText: { fontSize: 9, color: P.slateLt, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  xorBadge: {
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6,
  },
  xorBadgeText: { fontSize: 9, fontWeight: '900' },

  // ── Remove control ─────────────────────────────────────────────────────────
  removeControl: {
    marginTop: 14, width: '100%', borderRadius: 14,
    borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 10,
  },
  removeLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  removeCounter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterBtn: {
    width: 42, height: 42, borderRadius: 10,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: P.creamLt,
  },
  counterBtnText: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  counterVal: {
    width: 58, height: 42, borderRadius: 10,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  counterValText: { fontSize: 22, fontWeight: '900' },
  confirmBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, shadowOpacity: 0.35, elevation: 6,
  },
  confirmBtnText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2 },

  // ── Hint box ───────────────────────────────────────────────────────────────
  hintBox: {
    marginTop: 8, width: '100%', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1.5,
  },
  hintBoxText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // ── Message ────────────────────────────────────────────────────────────────
  msgBox: {
    marginTop: 10, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, width: '100%',
  },
  msgText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // ── Action row ─────────────────────────────────────────────────────────────
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, width: '100%' },
  resetBtn: {
    flex: 2, paddingVertical: 13, borderRadius: 14, alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, shadowOpacity: 0.35, elevation: 6,
  },
  resetBtnText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
  presetBtn: { flex: 2, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  presetBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  ytBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  ytBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },

  // ── XOR History ────────────────────────────────────────────────────────────
  historyPanel: {
    marginTop: 14, width: '100%', backgroundColor: P.creamLt,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#e8ceaa', padding: 12,
  },
  historyLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 2.5, marginBottom: 8, textAlign: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, justifyContent: 'center' },
  historyItem: { alignItems: 'center', gap: 3 },
  historyBar: { width: 18, borderRadius: 4, minHeight: 4 },
  historyVal: { fontSize: 9, fontWeight: '900' },

  // ── Modals ─────────────────────────────────────────────────────────────────
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(46,58,78,0.72)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 320, backgroundColor: P.creamLt, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  modalTitle: { fontWeight: '900', fontSize: 17, letterSpacing: 3, color: P.ink, marginBottom: 6 },
  modalBody: { fontSize: 13, color: '#525e75', textAlign: 'left', lineHeight: 21, width: '100%' },
  presetItem: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1.5, borderRadius: 10, backgroundColor: P.creamLt,
  },
  presetItemLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  presetItemDesc:  { fontSize: 10, marginTop: 2 },
  presetPiles: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  ytBtnModal: { paddingVertical: 10, borderRadius: 10, width: '100%', alignItems: 'center' },
  ytBtnModalText: { color: P.white, fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  modalClose: { paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalCloseText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
});
