// src/games/turningToads/TurningToadsGame.tsx
// CS Concept: Combinatorial game theory — symmetry + token movement

import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking, useWindowDimensions } from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { useGameStore } from '../../core/store';
import { createInitialState, selectToad, resetToads, TurningToadsState } from './turningToadsLogic';
import type { GameScreenProps } from '../registry';

const P = {
  creamLt: '#faf3e8', creamDk: '#e8ceaa', ink: '#2e3a4e', slateLt: '#8292ae',
  red: '#b84c2e', redLight: '#f2e0d5', redMid: '#dba08a',
  blue: '#2980b9', blueLight: '#eaf4fb', blueMid: '#aed6f1',
  teal: '#78938a', amber: '#c47b3a', green: '#4a7a4a', white: '#fff',
};
const YOUTUBE_URL = 'https://www.youtube.com/@DrukenCoder';
interface ExtendedProps extends GameScreenProps { onPlayerChange?: (p: 0 | 1) => void; accentColor?: string; }

export default forwardRef(function TurningToadsGame(
  { mode, onGameEnd, onExit, showHeader = true, onPlayerChange, accentColor }: ExtendedProps, ref
) {
  const [state, setState] = useState<TurningToadsState>(() => createInitialState());
  const [infoVisible, setInfoVisible] = useState(false);
  const addScore = useGameStore(s => s.addScore);
  const { width } = useWindowDimensions();
  const cellW = Math.min((width - 48) / 7, 52);

  const isRed = state.currentPlayer === 0;
  const activeCol = isRed ? P.red : P.blue;
  const activeBg = isRed ? P.redLight : P.blueLight;
  useEffect(() => { onPlayerChange?.(state.currentPlayer); }, [state.currentPlayer]);

  const handlePress = useCallback((idx: number) => {
    if (state.gameOver) return;
    const ns = selectToad(state, idx);
    setState(ns);
    if (ns.gameOver && ns.winner) { addScore(ns.winner, 1); setTimeout(() => onGameEnd(ns.winner!), 600); }
  }, [state]);

  const handleReset = useCallback(() => { setState(resetToads()); onPlayerChange?.(0); }, []);
  useImperativeHandle(ref, () => ({ reset: handleReset }));

  const validTargets = state.selectedIdx !== null
    ? new Set(state.validMoves.filter(m => m.from === state.selectedIdx).map(m => m.to))
    : new Set<number>();
  const selectableOwn = new Set(state.validMoves.map(m => m.from));

  const playerLabel = state.gameOver ? `${state.winner?.toUpperCase()} WINS!` : `${isRed ? 'RED' : 'BLUE'}'S TURN`;

  return (
    <View style={[styles.container, { backgroundColor: activeBg }]}>
      {showHeader && <GameHeader title="Turning Toads" onBack={onExit} onInfo={() => setInfoVisible(true)} accentColor={accentColor ?? activeCol} />}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { borderColor: activeCol + '55', backgroundColor: activeCol + '18' }]}>
          <Text style={[styles.bannerText, { color: activeCol }]}>{playerLabel}</Text>
          <Text style={[styles.subText, { color: P.slateLt }]}>MOVES: {state.moveCount}</Text>
        </View>

        <View style={styles.scoreRow}>
          <View style={[styles.scoreBox, { borderColor: P.red + '66', backgroundColor: isRed ? P.redMid : P.creamLt }]}>
            <Text style={[styles.scoreLabel, { color: P.red }]}>RED →</Text>
            <Text style={[styles.scoreNum, { color: P.red }]}>{state.scores[0]}</Text>
          </View>
          <View style={[styles.scoreBox, { borderColor: P.blue + '66', backgroundColor: !isRed ? P.blueMid : P.creamLt }]}>
            <Text style={[styles.scoreLabel, { color: P.blue }]}>← BLUE</Text>
            <Text style={[styles.scoreNum, { color: P.blue }]}>{state.scores[1]}</Text>
          </View>
        </View>

        {/* GOAL display */}
        <View style={[styles.goalBox, { borderColor: P.teal + '55' }]}>
          <Text style={[styles.goalLabel, { color: P.slateLt }]}>GOAL: SWAP ALL TOADS</Text>
          <View style={styles.goalRow}>
            {['B','B','B','_','R','R','R'].map((c, i) => (
              <View key={i} style={[styles.goalCell, { backgroundColor: c === 'R' ? P.redMid : c === 'B' ? P.blueMid : P.creamDk, width: cellW * 0.7, height: cellW * 0.7 }]}>
                <Text style={{ fontSize: cellW * 0.3, fontWeight: '900', color: P.white }}>{c === '_' ? '' : c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Board */}
        <View style={[styles.boardRow, { marginTop: 20 }]}>
          {state.cells.map((cell, idx) => {
            const isSelected = state.selectedIdx === idx;
            const isTarget = validTargets.has(idx);
            const isMovable = selectableOwn.has(idx);
            const cellColor = cell === 'R' ? P.red : cell === 'B' ? P.blue : 'transparent';
            const bgColor = isSelected ? activeCol : isTarget ? activeCol + '33' : cell === 'R' ? P.redMid : cell === 'B' ? P.blueMid : P.creamDk + '88';

            return (
              <TouchableOpacity key={idx} onPress={() => handlePress(idx)}
                style={[styles.toadCell, {
                  width: cellW, height: cellW * 1.1,
                  backgroundColor: bgColor,
                  borderColor: isSelected ? activeCol : isTarget ? activeCol + 'aa' : P.creamDk,
                  borderWidth: isSelected || isTarget ? 2.5 : 1.5,
                  borderRadius: 14,
                }]} activeOpacity={0.7}>
                {cell !== 'empty' && (
                  <>
                    <Text style={{ fontSize: cellW * 0.45, lineHeight: cellW * 0.5 }}>🐸</Text>
                    <Text style={{ fontSize: cellW * 0.2, fontWeight: '900', color: cell === 'R' ? P.red : P.blue }}>
                      {cell === 'R' ? '→' : '←'}
                    </Text>
                  </>
                )}
                {isTarget && cell === 'empty' && (
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: activeCol + 'cc' }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.boardIndices, { color: P.slateLt }]}>
          {state.cells.map((_, i) => i).join('     ')}
        </Text>

        {/* Move history */}
        {state.moveHistory.length > 0 && (
          <View style={styles.historyBox}>
            <Text style={[styles.historyTitle, { color: P.slateLt }]}>LAST MOVES</Text>
            {state.moveHistory.slice(-4).map((m, i) => (
              <Text key={i} style={[styles.historyItem, { color: m.player === 0 ? P.red : P.blue }]}>
                {m.player === 0 ? 'Red' : 'Blue'} {m.type === 'jump' ? 'jumped' : 'moved'}: {m.from} → {m.to}
              </Text>
            ))}
          </View>
        )}

        <View style={[styles.msgBox, { backgroundColor: activeCol + '11', borderColor: activeCol + '33' }]}>
          <Text style={[styles.msgText, { color: P.ink }]}>{state.message}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.resetBtn, { backgroundColor: activeCol, shadowColor: activeCol }]} onPress={handleReset} activeOpacity={0.82}>
            <Text style={styles.resetBtnText}>↺  RESET</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ytBtn, { borderColor: P.amber + '88' }]} onPress={() => Linking.openURL(YOUTUBE_URL)}>
            <Text style={[styles.ytBtnText, { color: P.amber }]}>▶  YOUTUBE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>TURNING TOADS</Text>
            <Text style={styles.modalBody}>
              {'🧠 CS CONCEPT: Combinatorial Game Theory\n\n'}
              {'Red frogs move RIGHT, Blue frogs move LEFT.\n\n'}
              {'MOVES:\n'}
              {'• Step into an adjacent empty space\n'}
              {'• Jump over exactly ONE opponent frog\n'}
              {'• Can never move backwards!\n\n'}
              {'GOAL: Fully swap all red and blue frogs.\n\n'}
              {'STRATEGY: Use symmetry — mirror the opponent\'s moves. The player who gets stuck first loses!'}
            </Text>
            <TouchableOpacity style={[styles.ytBtnModal, { backgroundColor: P.amber }]} onPress={() => { setInfoVisible(false); Linking.openURL(YOUTUBE_URL); }}>
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

const styles = StyleSheet.create({
  container: { flex: 1 }, scroll: { alignItems: 'center', paddingBottom: 32, paddingHorizontal: 16 },
  banner: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', width: '100%' },
  bannerText: { fontWeight: '900', fontSize: 13, letterSpacing: 3 }, subText: { fontSize: 9, letterSpacing: 2, marginTop: 2, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', gap: 10, marginTop: 10, width: '100%' },
  scoreBox: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 8, alignItems: 'center' },
  scoreLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 }, scoreNum: { fontSize: 24, fontWeight: '900' },
  goalBox: { marginTop: 14, width: '100%', backgroundColor: P.creamLt, borderRadius: 14, borderWidth: 1.5, padding: 12, alignItems: 'center' },
  goalLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  goalRow: { flexDirection: 'row', gap: 4 },
  goalCell: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  boardRow: { flexDirection: 'row', gap: 5 },
  toadCell: { alignItems: 'center', justifyContent: 'center', margin: 2 },
  boardIndices: { fontSize: 9, fontWeight: '700', marginTop: 4, letterSpacing: 10 },
  historyBox: { marginTop: 10, width: '100%', backgroundColor: P.creamLt, borderRadius: 14, borderWidth: 1.5, borderColor: P.creamDk, padding: 10 },
  historyTitle: { fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  historyItem: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  msgBox: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, width: '100%' },
  msgText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, width: '100%' },
  resetBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, shadowOpacity: 0.35, elevation: 6 },
  resetBtnText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
  ytBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  ytBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(46,58,78,0.72)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 320, backgroundColor: P.creamLt, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  modalTitle: { fontWeight: '900', fontSize: 17, letterSpacing: 3, color: P.ink, marginBottom: 6 },
  modalBody: { fontSize: 13, color: '#525e75', textAlign: 'left', lineHeight: 21, width: '100%' },
  ytBtnModal: { paddingVertical: 10, borderRadius: 10, width: '100%', alignItems: 'center' },
  ytBtnModalText: { color: P.white, fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  modalClose: { paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalCloseText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
});
