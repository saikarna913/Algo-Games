// src/games/morris/MorrisGame.tsx
// Nine Men's Morris — CS Concept: Graph Theory, Adjacency, Constraint Satisfaction

import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Linking, useWindowDimensions,
} from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { useGameStore } from '../../core/store';
import {
  createInitialState, applyTap, getValidTargets, resetState,
  ADJACENCY, MILLS, getActiveMills,
  MorrisState,
} from './morrisLogic';
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
  white:     '#fff',
};

const YOUTUBE_URL = 'https://www.youtube.com/@DrukenCoder';

interface ExtendedProps extends GameScreenProps {
  onPlayerChange?: (p: 0 | 1) => void;
  accentColor?: string;
}

// ─── Board position coordinates (normalised 0–1 within board square) ──────────
// Maps position index → { x, y } in 0..1 space
// 3 squares: outer (margin 0), middle (margin 0.25), inner (margin 0.42)
const M = [0, 0.19, 0.38]; // margins for outer, middle, inner
const POS: { x: number; y: number }[] = [
  // Outer square (indices 0–7)
  { x: M[0],       y: M[0] },       // 0 TL
  { x: 0.5,        y: M[0] },       // 1 TM
  { x: 1 - M[0],   y: M[0] },       // 2 TR
  { x: 1 - M[0],   y: 0.5 },        // 3 MR
  { x: 1 - M[0],   y: 1 - M[0] },   // 4 BR
  { x: 0.5,        y: 1 - M[0] },   // 5 BM
  { x: M[0],       y: 1 - M[0] },   // 6 BL
  { x: M[0],       y: 0.5 },        // 7 ML
  // Middle square (indices 8–15)
  { x: M[1],       y: M[1] },       // 8
  { x: 0.5,        y: M[1] },       // 9
  { x: 1 - M[1],   y: M[1] },       // 10
  { x: 1 - M[1],   y: 0.5 },        // 11
  { x: 1 - M[1],   y: 1 - M[1] },   // 12
  { x: 0.5,        y: 1 - M[1] },   // 13
  { x: M[1],       y: 1 - M[1] },   // 14
  { x: M[1],       y: 0.5 },        // 15
  // Inner square (indices 16–23)
  { x: M[2],       y: M[2] },       // 16
  { x: 0.5,        y: M[2] },       // 17
  { x: 1 - M[2],   y: M[2] },       // 18
  { x: 1 - M[2],   y: 0.5 },        // 19
  { x: 1 - M[2],   y: 1 - M[2] },   // 20
  { x: 0.5,        y: 1 - M[2] },   // 21
  { x: M[2],       y: 1 - M[2] },   // 22
  { x: M[2],       y: 0.5 },        // 23
];

// ─── Board lines (only draw each edge once) ───────────────────────────────────
// We draw the 3 squares + the 4 spokes explicitly
const BOARD_LINES: [number, number][] = [
  // Outer square
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],
  // Middle square
  [8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,8],
  // Inner square
  [16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,16],
  // Spokes
  [1,9],[9,17],   // top spoke
  [3,11],[11,19], // right spoke
  [5,13],[13,21], // bottom spoke
  [7,15],[15,23], // left spoke
];

export default forwardRef(function MorrisGame(
  { mode, onGameEnd, onExit, showHeader = true, onPlayerChange, accentColor }: ExtendedProps,
  ref
) {
  const [state, setState] = useState<MorrisState>(() => createInitialState());
  const [infoVisible, setInfoVisible] = useState(false);
  const addScore = useGameStore((s) => s.addScore);
  const { width, height } = useWindowDimensions();

  const isRed   = state.currentPlayer === 'red';
  const activeCol = isRed ? P.red  : P.blue;
  const activeBg  = isRed ? P.redLight : P.blueLight;

  useEffect(() => { onPlayerChange?.(isRed ? 0 : 1); }, [state.currentPlayer]);

  const handleTap = useCallback((idx: number) => {
    if (state.gameOver) return;
    const newState = applyTap(state, idx);
    setState(newState);
    if (newState.gameOver && newState.winner) {
      addScore(newState.winner, 1);
      setTimeout(() => onGameEnd(newState.winner!), 700);
    }
  }, [state, addScore, onGameEnd]);

  const handleReset = useCallback(() => {
    setState(resetState());
    onPlayerChange?.(0);
  }, []);

  useImperativeHandle(ref, () => ({ reset: handleReset }));

  // Board size — square, fits width with padding
  const boardSize = Math.min(width - 32, height * 0.46, 360);
  const nodeR = boardSize * 0.057; // node radius
  const validTargets = getValidTargets(state);

  // Mill positions (flat set for O(1) lookup)
  const millSet = new Set(state.mills.flat());

  const playerLabel = state.gameOver
    ? (state.winner ? `${state.winner.toUpperCase()} WINS!` : 'DRAW!')
    : state.millFormed
      ? `${isRed ? 'RED' : 'BLUE'}: REMOVE A PIECE`
      : `${isRed ? 'RED' : 'BLUE'}'S TURN`;

  const phaseLabel = () => {
    if (state.gameOver) return '';
    const pi = isRed ? 0 : 1;
    const p = state.phase[pi];
    if (p === 'place') return `PLACING  (${state.piecesInHand[pi]} left)`;
    if (p === 'fly')   return '✈ FLY MODE';
    return 'MOVING';
  };

  return (
    <View style={[styles.container, { backgroundColor: activeBg }]}>
      {showHeader && (
        <GameHeader
          title="Nine Men's Morris"
          onBack={onExit}
          onInfo={() => setInfoVisible(true)}
          accentColor={accentColor ?? activeCol}
        />
      )}

      {/* Turn banner */}
      <View style={[styles.banner, { borderColor: activeCol + '55', backgroundColor: activeCol + '18' }]}>
        <Text style={[styles.bannerText, { color: activeCol }]}>{playerLabel}</Text>
        <Text style={[styles.phaseText, { color: P.slateLt }]}>{phaseLabel()}</Text>
      </View>

      {/* Scores + piece counts */}
      <View style={styles.scoreRow}>
        {/* Red info */}
        <View style={[styles.scoreBox, { borderColor: P.red + '66', backgroundColor: isRed ? P.redMid : P.creamLt }]}>
          <View style={[styles.pieceDot, { backgroundColor: P.red }]} />
          <Text style={[styles.scoreLabel, { color: P.red }]}>RED</Text>
          <Text style={[styles.scoreNum, { color: P.red }]}>{state.scores[0]}</Text>
          <Text style={[styles.pieceMini, { color: P.red }]}>
            ✋{state.piecesInHand[0]}  🔴{state.piecesOnBoard[0]}
          </Text>
        </View>

        {/* Centre move count */}
        <View style={styles.moveBox}>
          <Text style={[styles.moveLabel, { color: P.slateLt }]}>MOVES</Text>
          <Text style={[styles.moveNum, { color: P.ink }]}>{state.moveCount}</Text>
        </View>

        {/* Blue info */}
        <View style={[styles.scoreBox, { borderColor: P.blue + '66', backgroundColor: !isRed ? P.blueMid : P.creamLt }]}>
          <View style={[styles.pieceDot, { backgroundColor: P.blue }]} />
          <Text style={[styles.scoreLabel, { color: P.blue }]}>BLUE</Text>
          <Text style={[styles.scoreNum, { color: P.blue }]}>{state.scores[1]}</Text>
          <Text style={[styles.pieceMini, { color: P.blue }]}>
            ✋{state.piecesInHand[1]}  🔵{state.piecesOnBoard[1]}
          </Text>
        </View>
      </View>

      {/* ── BOARD ──────────────────────────────────────────────────────────── */}
      <View style={[styles.boardWrapper, { width: boardSize, height: boardSize, borderColor: activeCol + '44' }]}>

        {/* Board lines */}
        {BOARD_LINES.map(([a, b], li) => {
          const ax = POS[a].x * boardSize;
          const ay = POS[a].y * boardSize;
          const bx = POS[b].x * boardSize;
          const by = POS[b].y * boardSize;
          const dx = bx - ax;
          const dy = by - ay;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          // Highlight lines that are part of active mills
          const inMill = state.mills.some(m => {
            const has = (n: number) => n === a || n === b;
            return m.some(has);
          });

          return (
            <View
              key={`line-${li}`}
              style={{
                position: 'absolute',
                left: ax,
                top: ay,
                width: len,
                height: inMill ? 3 : 1.5,
                backgroundColor: inMill ? activeCol : P.teal + '88',
                transform: [
                  { translateX: 0 },
                  { translateY: inMill ? -0.5 : 0 },
                  { rotate: `${angle}deg` },
                  { translateX: 0 },
                ],
                transformOrigin: '0% 50%',
              }}
            />
          );
        })}

        {/* Nodes */}
        {POS.map((pos, idx) => {
          const cx = pos.x * boardSize;
          const cy = pos.y * boardSize;
          const cell = state.board[idx];
          const isValid   = validTargets.includes(idx);
          const isSelected = state.selectedIdx === idx;
          const inMill    = millSet.has(idx);
          const isLast    = state.lastPlaced === idx || state.lastRemoved === idx;

          const bgCol = cell === 'red'
            ? (inMill ? P.red : P.redMid)
            : cell === 'blue'
              ? (inMill ? P.blue : P.blueMid)
              : isValid
                ? activeCol + '33'
                : P.creamDk;

          const borderCol = isSelected
            ? activeCol
            : inMill
              ? activeCol
              : cell === 'red'
                ? P.red + 'cc'
                : cell === 'blue'
                  ? P.blue + 'cc'
                  : isValid
                    ? activeCol + '99'
                    : P.teal + '55';

          return (
            <TouchableOpacity
              key={idx}
              onPress={() => handleTap(idx)}
              activeOpacity={0.7}
              style={{
                position: 'absolute',
                left: cx - nodeR,
                top: cy - nodeR,
                width: nodeR * 2,
                height: nodeR * 2,
                zIndex: 2,
              }}
            >
              <View
                style={{
                  width: nodeR * 2,
                  height: nodeR * 2,
                  borderRadius: nodeR,
                  backgroundColor: bgCol,
                  borderWidth: isSelected || inMill ? 2.5 : 1.5,
                  borderColor: borderCol,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: cell ? (cell === 'red' ? P.red : P.blue) : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: cell ? 0.4 : 0,
                  shadowRadius: 4,
                  elevation: cell ? 4 : 1,
                }}
              >
                {/* Inner highlight dot on placed pieces */}
                {cell && (
                  <View style={{
                    width: nodeR * 0.5,
                    height: nodeR * 0.5,
                    borderRadius: nodeR * 0.25,
                    backgroundColor: '#ffffff55',
                  }} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Message bar */}
      <View style={[styles.msgBox, { backgroundColor: activeCol + '11', borderColor: activeCol + '33' }]}>
        <Text style={[styles.msgText, { color: P.ink }]}>{state.message}</Text>
      </View>

      {/* Buttons row */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.resetBtn, { backgroundColor: activeCol, shadowColor: activeCol }]}
          onPress={handleReset}
          activeOpacity={0.82}
        >
          <Text style={styles.resetBtnText}>↺  RESET</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ytBtn, { borderColor: P.amber + '88' }]}
          onPress={() => Linking.openURL(YOUTUBE_URL)}
          activeOpacity={0.8}
        >
          <Text style={[styles.ytBtnText, { color: P.amber }]}>▶  YOUTUBE</Text>
        </TouchableOpacity>
      </View>

      {/* ── Info Modal ──────────────────────────────────────────────────────── */}
      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>NINE MEN'S MORRIS</Text>
            <Text style={styles.modalBody}>
              {'🧠 CS CONCEPT: Graph Theory\n\n'}
              {'The board is a graph of 24 nodes connected by edges. A "mill" is a path of length 2 — finding mills is constraint satisfaction!\n\n'}
              {'PHASES:\n'}
              {'1️⃣  PLACE — Each player places 9 pieces\n'}
              {'2️⃣  MOVE  — Move to adjacent nodes\n'}
              {'3️⃣  FLY   — When 3 pieces left, fly anywhere\n\n'}
              {'MILLS: Form 3 in a row → remove opponent piece\n\n'}
              {'WIN: Reduce opponent to 2 pieces OR block all moves'}
            </Text>
            <TouchableOpacity
              style={[styles.ytBtnModal, { backgroundColor: P.amber }]}
              onPress={() => { setInfoVisible(false); Linking.openURL(YOUTUBE_URL); }}
            >
              <Text style={styles.ytBtnModalText}>▶  WATCH ON YOUTUBE</Text>
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
  container: { flex: 1, alignItems: 'center', paddingBottom: 12 },

  banner: {
    marginTop: 14, marginHorizontal: 20, paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 12, borderWidth: 1.5, alignItems: 'center', width: '90%',
  },
  bannerText: { fontWeight: '900', fontSize: 13, letterSpacing: 3 },
  phaseText:  { fontSize: 9, letterSpacing: 2, marginTop: 3, fontWeight: '700' },

  scoreRow: { flexDirection: 'row', gap: 8, marginTop: 10, width: '90%', alignItems: 'center' },
  scoreBox: {
    flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 8,
    alignItems: 'center', gap: 2,
  },
  pieceDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 2 },
  scoreLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  scoreNum:   { fontSize: 22, fontWeight: '900' },
  pieceMini:  { fontSize: 8, fontWeight: '700', marginTop: 2 },
  moveBox:    { alignItems: 'center', width: 50 },
  moveLabel:  { fontSize: 7, fontWeight: '900', letterSpacing: 1.5 },
  moveNum:    { fontSize: 18, fontWeight: '900' },

  boardWrapper: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#faf3e8',
    shadowColor: '#2e3a4e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },

  msgBox: {
    marginTop: 12, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, width: '90%',
  },
  msgText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  btnRow: { flexDirection: 'row', gap: 12, marginTop: 12, width: '90%' },
  resetBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, shadowOpacity: 0.35, elevation: 6,
  },
  resetBtnText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 3 },
  ytBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, alignItems: 'center',
  },
  ytBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(46,58,78,0.72)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 320, backgroundColor: '#faf3e8', borderRadius: 20, padding: 28, alignItems: 'center' },
  modalTitle: { fontWeight: '900', fontSize: 17, letterSpacing: 3, color: '#2e3a4e', marginBottom: 14 },
  modalBody:  { fontSize: 13, color: '#525e75', textAlign: 'left', lineHeight: 21, marginBottom: 16, width: '100%' },
  ytBtnModal: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginBottom: 10, width: '100%', alignItems: 'center' },
  ytBtnModalText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  modalClose: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalCloseText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
});
