// src/games/subtractSet/SubtractSetGame.tsx
// CS Concept: DP on game states — winning/losing via dp[n]

import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking } from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { useGameStore } from '../../core/store';
import { createSubtractState, applySubtractMove, resetSubtract, computeDP, PRESETS, SubtractSetState } from './subtractSetLogic';
import type { GameScreenProps } from '../registry';

const P = {
  creamLt: '#faf3e8', creamDk: '#e8ceaa', ink: '#2e3a4e', slateLt: '#8292ae',
  red: '#b84c2e', redLight: '#f2e0d5', redMid: '#dba08a',
  blue: '#2980b9', blueLight: '#eaf4fb', blueMid: '#aed6f1',
  teal: '#78938a', amber: '#c47b3a', green: '#4a7a4a', white: '#fff',
};
const YOUTUBE_URL = 'https://www.youtube.com/@DrukenCoder';
interface ExtendedProps extends GameScreenProps { onPlayerChange?: (p: 0 | 1) => void; accentColor?: string; }

export default forwardRef(function SubtractSetGame(
  { mode, onGameEnd, onExit, showHeader = true, onPlayerChange, accentColor }: ExtendedProps, ref
) {
  const [state, setState] = useState<SubtractSetState>(() => createSubtractState());
  const [infoVisible, setInfoVisible] = useState(false);
  const addScore = useGameStore(s => s.addScore);

  const isRed = state.currentPlayer === 0;
  const activeCol = isRed ? P.red : P.blue;
  const activeBg = isRed ? P.redLight : P.blueLight;
  useEffect(() => { onPlayerChange?.(state.currentPlayer); }, [state.currentPlayer]);

  const handleMove = useCallback((n: number) => {
    const ns = applySubtractMove(state, n);
    setState(ns);
    if (ns.gameOver && ns.winner) { addScore(ns.winner, 1); setTimeout(() => onGameEnd(ns.winner!), 600); }
  }, [state]);

  const handleReset = useCallback((pile?: number, S?: number[]) => {
    setState(resetSubtract(pile, S)); onPlayerChange?.(0);
  }, []);
  useImperativeHandle(ref, () => ({ reset: () => handleReset() }));

  const playerLabel = state.gameOver ? `${state.winner?.toUpperCase()} WINS!` : `${isRed ? 'RED' : 'BLUE'}'S TURN`;

  return (
    <View style={[styles.container, { backgroundColor: activeBg }]}>
      {showHeader && <GameHeader title="Subtract-a-Set" onBack={onExit} onInfo={() => setInfoVisible(true)} accentColor={accentColor ?? activeCol} />}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { borderColor: activeCol + '55', backgroundColor: activeCol + '18' }]}>
          <Text style={[styles.bannerText, { color: activeCol }]}>{playerLabel}</Text>
          <Text style={[styles.subText, { color: P.slateLt }]}>N={state.pile}  S={'{' + state.moveSet.join(',') + '}'}</Text>
        </View>

        <View style={styles.scoreRow}>
          <View style={[styles.scoreBox, { borderColor: P.red + '66', backgroundColor: isRed ? P.redMid : P.creamLt }]}>
            <Text style={[styles.scoreLabel, { color: P.red }]}>RED</Text><Text style={[styles.scoreNum, { color: P.red }]}>{state.scores[0]}</Text>
          </View>
          <View style={[styles.dpBadge, { borderColor: state.dp[state.pile] ? P.green + '88' : P.red + '88', backgroundColor: state.dp[state.pile] ? P.green + '18' : P.red + '18' }]}>
            <Text style={[styles.dpLabel, { color: state.dp[state.pile] ? P.green : P.red }]}>dp[{state.pile}]</Text>
            <Text style={[styles.dpVal, { color: state.dp[state.pile] ? P.green : P.red }]}>{state.dp[state.pile] ? 'WIN' : 'LOSE'}</Text>
          </View>
          <View style={[styles.scoreBox, { borderColor: P.blue + '66', backgroundColor: !isRed ? P.blueMid : P.creamLt }]}>
            <Text style={[styles.scoreLabel, { color: P.blue }]}>BLUE</Text><Text style={[styles.scoreNum, { color: P.blue }]}>{state.scores[1]}</Text>
          </View>
        </View>

        {/* Stone visualisation */}
        <View style={[styles.stoneBox, { borderColor: activeCol + '44' }]}>
          <Text style={[styles.stoneLabel, { color: P.slateLt }]}>PILE  ·  {state.pile} stones</Text>
          <View style={styles.stonesGrid}>
            {Array.from({ length: state.originalPile }).map((_, i) => {
              const removed = i >= state.pile;
              return (
                <View key={i} style={{ width: 18, height: 15, borderRadius: 9, backgroundColor: removed ? 'transparent' : P.teal + 'aa', borderWidth: 1.5, borderColor: removed ? P.creamDk + '55' : P.teal, borderStyle: removed ? 'dashed' : 'solid', margin: 2 }} />
              );
            })}
          </View>
        </View>

        {/* Move buttons */}
        {!state.gameOver && (
          <View style={styles.moveRow}>
            {state.moveSet.map(n => {
              const canMove = n <= state.pile;
              const optimal = state.dp[state.pile] && canMove && !state.dp[state.pile - n];
              return (
                <TouchableOpacity key={n}
                  style={[styles.moveBtn, { borderColor: optimal ? P.amber : activeCol + '77', backgroundColor: optimal ? P.amber + '22' : P.creamLt, opacity: canMove ? 1 : 0.35 }]}
                  disabled={!canMove} onPress={() => handleMove(n)} activeOpacity={0.8}>
                  <Text style={[styles.moveBtnNum, { color: optimal ? P.amber : activeCol }]}>{n}</Text>
                  {optimal && <Text style={[styles.optimalTag, { color: P.amber }]}>OPTIMAL</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* DP table */}
        <TouchableOpacity style={[styles.dpToggle, { borderColor: P.amber + '88', backgroundColor: state.showDP ? P.amber + '22' : P.creamLt }]}
          onPress={() => setState(s => ({ ...s, showDP: !s.showDP }))}>
          <Text style={[styles.dpToggleText, { color: P.amber }]}>{state.showDP ? '▼ HIDE DP TABLE' : '▶ SHOW DP TABLE'}</Text>
        </TouchableOpacity>

        {state.showDP && (
          <View style={styles.dpTable}>
            <Text style={[styles.dpTableTitle, { color: P.slateLt }]}>dp[n] = OR(¬dp[n-s]) for s ∈ S</Text>
            <View style={styles.dpRow}>
              {state.dp.map((win, i) => (
                <View key={i} style={[styles.dpCell, { backgroundColor: i === state.pile ? (win ? P.green : P.red) + '55' : (win ? P.green : P.red) + '22', borderColor: i === state.pile ? (win ? P.green : P.red) : 'transparent', borderWidth: i === state.pile ? 2 : 0 }]}>
                  <Text style={[styles.dpCellN, { color: P.slateLt }]}>{i}</Text>
                  <Text style={[styles.dpCellVal, { color: win ? P.green : P.red }]}>{win ? 'W' : 'L'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.msgBox, { backgroundColor: activeCol + '11', borderColor: activeCol + '33' }]}>
          <Text style={[styles.msgText, { color: P.ink }]}>{state.message}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.resetBtn, { backgroundColor: activeCol, shadowColor: activeCol }]} onPress={() => handleReset()} activeOpacity={0.82}>
            <Text style={styles.resetBtnText}>↺  RESET</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ytBtn, { borderColor: P.amber + '88' }]} onPress={() => Linking.openURL(YOUTUBE_URL)}>
            <Text style={[styles.ytBtnText, { color: P.amber }]}>▶ YT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.presetRow}>
          {PRESETS.map((p, i) => (
            <TouchableOpacity key={i} style={[styles.presetBtn, { borderColor: P.teal + '66' }]} onPress={() => handleReset(p.N, p.S)}>
              <Text style={[styles.presetBtnText, { color: P.teal }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>SUBTRACT-A-SET</Text>
            <Text style={styles.modalBody}>
              {'🧠 CS CONCEPT: Dynamic Programming\n\n'}
              {'One pile, N stones. On each turn, remove any number from set S.\nLast stone wins.\n\n'}
              {'STRATEGY via DP:\n'}
              {'  dp[0] = LOSE (no stones → you lost)\n'}
              {'  dp[n] = WIN if any move s ∈ S makes dp[n-s] = LOSE\n\n'}
              {'Example S={1,3,4}:\n'}
              {'  dp: L W L W W W L W L W W W L W...\n'}
              {'  Pattern repeats every 7 steps!'}
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
  scoreRow: { flexDirection: 'row', gap: 10, marginTop: 10, width: '100%', alignItems: 'center' },
  scoreBox: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 8, alignItems: 'center' },
  scoreLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2 }, scoreNum: { fontSize: 24, fontWeight: '900' },
  dpBadge: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 6, alignItems: 'center' },
  dpLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 }, dpVal: { fontSize: 16, fontWeight: '900' },
  stoneBox: { marginTop: 14, width: '100%', backgroundColor: P.creamLt, borderRadius: 16, borderWidth: 1.5, padding: 14, alignItems: 'center' },
  stoneLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  stonesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  moveRow: { flexDirection: 'row', gap: 12, marginTop: 14, width: '100%' },
  moveBtn: { flex: 1, borderWidth: 2, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  moveBtnNum: { fontSize: 26, fontWeight: '900' },
  optimalTag: { fontSize: 7, fontWeight: '900', letterSpacing: 1.5, marginTop: 2 },
  dpToggle: { marginTop: 12, width: '100%', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  dpToggleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  dpTable: { marginTop: 8, width: '100%', backgroundColor: P.creamLt, borderRadius: 14, borderWidth: 1.5, borderColor: P.creamDk, padding: 12 },
  dpTableTitle: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 10, textAlign: 'center' },
  dpRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  dpCell: { width: 30, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  dpCellN: { fontSize: 8, fontWeight: '700' }, dpCellVal: { fontSize: 11, fontWeight: '900' },
  msgBox: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, width: '100%' },
  msgText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, width: '100%' },
  resetBtn: { flex: 2, paddingVertical: 13, borderRadius: 14, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, shadowOpacity: 0.35, elevation: 6 },
  resetBtnText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
  ytBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  ytBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  presetBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  presetBtnText: { fontSize: 10, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(46,58,78,0.72)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 320, backgroundColor: P.creamLt, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  modalTitle: { fontWeight: '900', fontSize: 17, letterSpacing: 3, color: P.ink, marginBottom: 6 },
  modalBody: { fontSize: 13, color: '#525e75', textAlign: 'left', lineHeight: 21, width: '100%' },
  ytBtnModal: { paddingVertical: 10, borderRadius: 10, width: '100%', alignItems: 'center' },
  ytBtnModalText: { color: P.white, fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  modalClose: { paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalCloseText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
});
