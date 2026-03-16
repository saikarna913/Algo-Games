// src/games/wythoff/WythoffGame.tsx
// CS Concept: Wythoff's Game — Golden Ratio losing positions

import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking, useWindowDimensions } from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { useGameStore } from '../../core/store';
import { createInitialState, applyWythoffMove, resetWythoff, isLosingPosition, findOptimalMove, WythoffState } from './wythoffLogic';
import type { GameScreenProps } from '../registry';

const P = {
  creamLt: '#faf3e8', creamDk: '#e8ceaa', ink: '#2e3a4e', slateLt: '#8292ae',
  red: '#b84c2e', redLight: '#f2e0d5', redMid: '#dba08a',
  blue: '#2980b9', blueLight: '#eaf4fb', blueMid: '#aed6f1',
  teal: '#78938a', amber: '#c47b3a', green: '#4a7a4a', white: '#fff',
};
const YOUTUBE_URL = 'https://www.youtube.com/@DrukenCoder';

interface ExtendedProps extends GameScreenProps {
  onPlayerChange?: (p: 0 | 1) => void;
  accentColor?: string;
}

function Stone({ size = 18, color = '#c8b89a' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size * 0.85, borderRadius: size * 0.42, backgroundColor: color, borderWidth: 1.5, borderColor: '#a89070', margin: 2, shadowColor: '#0003', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 1 }}>
      <View style={{ position: 'absolute', top: 2, left: 3, width: size * 0.3, height: size * 0.2, borderRadius: size * 0.1, backgroundColor: '#ffffff55' }} />
    </View>
  );
}

export default forwardRef(function WythoffGame(
  { mode, onGameEnd, onExit, showHeader = true, onPlayerChange, accentColor }: ExtendedProps, ref
) {
  const [state, setState] = useState<WythoffState>(() => createInitialState());
  const [selectedPile, setSelectedPile] = useState<0 | 1 | 'both' | null>(null);
  const [removeA, setRemoveA] = useState(1);
  const [removeB, setRemoveB] = useState(1);
  const [infoVisible, setInfoVisible] = useState(false);
  const addScore = useGameStore(s => s.addScore);

  const isRed = state.currentPlayer === 0;
  const activeCol = isRed ? P.red : P.blue;
  const activeBg = isRed ? P.redLight : P.blueLight;

  useEffect(() => { onPlayerChange?.(state.currentPlayer); }, [state.currentPlayer]);

  const doMove = useCallback((newPiles: [number, number], type: 'one' | 'both') => {
    const newState = applyWythoffMove(state, newPiles, type);
    setState(newState);
    setSelectedPile(null);
    if (newState.gameOver && newState.winner) {
      addScore(newState.winner, 1);
      setTimeout(() => onGameEnd(newState.winner!), 600);
    }
  }, [state]);

  const handleReset = useCallback((piles?: [number, number]) => {
    setState(resetWythoff(piles));
    setSelectedPile(null);
    onPlayerChange?.(0);
  }, []);

  useImperativeHandle(ref, () => ({ reset: () => handleReset() }));

  const playerLabel = state.gameOver ? `${state.winner?.toUpperCase()} WINS!` : `${isRed ? 'RED' : 'BLUE'}'S TURN`;
  const losing = isLosingPosition(state.piles);
  const hint = findOptimalMove(state.piles);
  const GRID_MAX = 12;

  return (
    <View style={[styles.container, { backgroundColor: activeBg }]}>
      {showHeader && <GameHeader title="Wythoff's Game" onBack={onExit} onInfo={() => setInfoVisible(true)} accentColor={accentColor ?? activeCol} />}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { borderColor: activeCol + '55', backgroundColor: activeCol + '18' }]}>
          <Text style={[styles.bannerText, { color: activeCol }]}>{playerLabel}</Text>
          <Text style={[styles.subText, { color: P.slateLt }]}>PILES: ({state.piles[0]}, {state.piles[1]})</Text>
        </View>

        <View style={styles.scoreRow}>
          <View style={[styles.scoreBox, { borderColor: P.red + '66', backgroundColor: isRed ? P.redMid : P.creamLt }]}>
            <Text style={[styles.scoreLabel, { color: P.red }]}>RED</Text>
            <Text style={[styles.scoreNum, { color: P.red }]}>{state.scores[0]}</Text>
          </View>
          <View style={[styles.phiBadge, { borderColor: losing ? P.red + '88' : P.green + '88', backgroundColor: losing ? P.red + '18' : P.green + '18' }]}>
            <Text style={[styles.phiLabel, { color: losing ? P.red : P.green }]}>φ-pair?</Text>
            <Text style={[styles.phiVal, { color: losing ? P.red : P.green }]}>{losing ? 'YES ⚠' : 'NO ✓'}</Text>
          </View>
          <View style={[styles.scoreBox, { borderColor: P.blue + '66', backgroundColor: !isRed ? P.blueMid : P.creamLt }]}>
            <Text style={[styles.scoreLabel, { color: P.blue }]}>BLUE</Text>
            <Text style={[styles.scoreNum, { color: P.blue }]}>{state.scores[1]}</Text>
          </View>
        </View>

        {/* Two piles visualisation */}
        <View style={styles.pilesRow}>
          {([0, 1] as const).map(pi => (
            <View key={pi} style={[styles.pileCard, { borderColor: (selectedPile === pi || selectedPile === 'both') ? activeCol : P.creamDk }]}>
              <View style={[styles.pileHeader, { backgroundColor: (selectedPile === pi || selectedPile === 'both') ? activeCol : P.teal }]}>
                <Text style={styles.pileHeaderText}>PILE {pi + 1}  ·  {state.piles[pi]}</Text>
              </View>
              <View style={styles.stonesWrap}>
                {Array.from({ length: state.piles[pi] }).map((_, i) => (
                  <Stone key={i} size={16} color={pi === 0 ? P.redMid : P.blueMid} />
                ))}
                {state.piles[pi] === 0 && <Text style={styles.emptyLabel}>empty</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* Move controls */}
        {!state.gameOver && (
          <View style={styles.controlBox}>
            <Text style={[styles.controlTitle, { color: P.slateLt }]}>YOUR MOVE</Text>
            {/* Remove from pile 1 */}
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: P.red }]}>Pile 1 remove:</Text>
              <TouchableOpacity style={styles.adjBtn} onPress={() => setRemoveA(a => Math.max(0, a - 1))}><Text style={styles.adjBtnText}>−</Text></TouchableOpacity>
              <Text style={[styles.adjVal, { color: P.red }]}>{removeA}</Text>
              <TouchableOpacity style={styles.adjBtn} onPress={() => setRemoveA(a => Math.min(state.piles[0], a + 1))}><Text style={styles.adjBtnText}>+</Text></TouchableOpacity>
            </View>
            <View style={styles.controlRow}>
              <Text style={[styles.controlLabel, { color: P.blue }]}>Pile 2 remove:</Text>
              <TouchableOpacity style={styles.adjBtn} onPress={() => setRemoveB(b => Math.max(0, b - 1))}><Text style={styles.adjBtnText}>−</Text></TouchableOpacity>
              <Text style={[styles.adjVal, { color: P.blue }]}>{removeB}</Text>
              <TouchableOpacity style={styles.adjBtn} onPress={() => setRemoveB(b => Math.min(state.piles[1], b + 1))}><Text style={styles.adjBtnText}>+</Text></TouchableOpacity>
            </View>
            <View style={styles.moveBtnRow}>
              <TouchableOpacity style={[styles.moveOptionBtn, { backgroundColor: P.red, opacity: removeA > 0 ? 1 : 0.4 }]} disabled={removeA === 0}
                onPress={() => doMove([state.piles[0] - removeA, state.piles[1]], 'one')}>
                <Text style={styles.moveOptionText}>REMOVE {removeA} FROM PILE 1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.moveOptionBtn, { backgroundColor: P.blue, opacity: removeB > 0 ? 1 : 0.4 }]} disabled={removeB === 0}
                onPress={() => doMove([state.piles[0], state.piles[1] - removeB], 'one')}>
                <Text style={styles.moveOptionText}>REMOVE {removeB} FROM PILE 2</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.moveOptionBtn, { backgroundColor: P.teal, opacity: removeA > 0 && removeA <= Math.min(state.piles[0], state.piles[1]) ? 1 : 0.4 }]}
                disabled={removeA <= 0 || removeA > Math.min(state.piles[0], state.piles[1])}
                onPress={() => doMove([state.piles[0] - removeA, state.piles[1] - removeA], 'both')}>
                <Text style={styles.moveOptionText}>REMOVE {removeA} FROM BOTH</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Hint */}
        {state.showHint && hint && !state.gameOver && (
          <View style={[styles.hintBox, { borderColor: P.amber + '88', backgroundColor: P.amber + '11' }]}>
            <Text style={[styles.hintText, { color: P.amber }]}>
              💡 Optimal: move to ({hint.result[0]}, {hint.result[1]}) — that's a φ-pair!
            </Text>
          </View>
        )}

        {/* φ-pair table */}
        <View style={styles.phiTable}>
          <Text style={[styles.phiTableTitle, { color: P.slateLt }]}>GOLDEN RATIO LOSING PAIRS</Text>
          <View style={styles.phiTableRow}>
            {state.losingPairs.slice(1, 8).map(([a, b], i) => {
              const active = (state.piles[0] === a && state.piles[1] === b) || (state.piles[0] === b && state.piles[1] === a);
              return (
                <View key={i} style={[styles.phiPairItem, { backgroundColor: active ? P.red + '33' : P.creamLt, borderColor: active ? P.red : P.creamDk }]}>
                  <Text style={[styles.phiPairText, { color: active ? P.red : P.slateLt }]}>({a},{b})</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.msgBox, { backgroundColor: activeCol + '11', borderColor: activeCol + '33' }]}>
          <Text style={[styles.msgText, { color: P.ink }]}>{state.message}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.hintToggle, { borderColor: P.amber + '88', backgroundColor: state.showHint ? P.amber + '22' : P.creamLt }]}
            onPress={() => setState(s => ({ ...s, showHint: !s.showHint }))}>
            <Text style={[styles.hintToggleText, { color: P.amber }]}>{state.showHint ? '▼ HINT' : '▶ HINT'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.resetBtn, { backgroundColor: activeCol, shadowColor: activeCol }]} onPress={() => handleReset()} activeOpacity={0.82}>
            <Text style={styles.resetBtnText}>↺  RESET</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ytBtn, { borderColor: P.amber + '88' }]} onPress={() => Linking.openURL(YOUTUBE_URL)}>
            <Text style={[styles.ytBtnText, { color: P.amber }]}>▶ YT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.presetRow}>
          {([[1,2],[3,5],[4,7],[6,10],[8,13]] as [number,number][]).map(([a,b]) => (
            <TouchableOpacity key={`${a}${b}`} style={[styles.presetBtn, { borderColor: P.teal + '66' }]} onPress={() => handleReset([a,b])}>
              <Text style={[styles.presetBtnText, { color: P.teal }]}>({a},{b})</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>WYTHOFF'S GAME</Text>
            <Text style={styles.modalBody}>
              {'🧠 CS CONCEPT: Golden Ratio + Game Theory\n\n'}
              {'Two piles. Each turn: remove any from ONE pile, OR equal amounts from BOTH. Last stones wins.\n\n'}
              {'LOSING POSITIONS follow φ = 1.618:\n'}
              {'  aₖ = ⌊k·φ⌋,  bₖ = ⌊k·φ²⌋ = aₖ + k\n\n'}
              {'Examples: (1,2) (3,5) (4,7) (6,10) (8,13)\n\n'}
              {'If piles match a φ-pair → you LOSE.\nOtherwise move to a φ-pair to win!'}
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
  phiBadge: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 6, alignItems: 'center' },
  phiLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 }, phiVal: { fontSize: 14, fontWeight: '900' },
  pilesRow: { flexDirection: 'row', gap: 12, marginTop: 14, width: '100%' },
  pileCard: { flex: 1, borderRadius: 14, borderWidth: 2, backgroundColor: P.creamLt, overflow: 'hidden' },
  pileHeader: { paddingVertical: 8, alignItems: 'center' }, pileHeaderText: { color: P.white, fontWeight: '900', fontSize: 10, letterSpacing: 1.5 },
  stonesWrap: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, justifyContent: 'center', minHeight: 36 },
  emptyLabel: { color: P.slateLt, fontSize: 9, fontWeight: '700' },
  controlBox: { marginTop: 12, width: '100%', backgroundColor: P.creamLt, borderRadius: 14, borderWidth: 1.5, borderColor: P.creamDk, padding: 14 },
  controlTitle: { fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  controlLabel: { flex: 1, fontSize: 11, fontWeight: '700' },
  adjBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1.5, borderColor: P.creamDk, backgroundColor: P.creamLt, alignItems: 'center', justifyContent: 'center' },
  adjBtnText: { fontSize: 18, fontWeight: '900', color: P.ink },
  adjVal: { fontSize: 20, fontWeight: '900', width: 32, textAlign: 'center' },
  moveBtnRow: { gap: 6, marginTop: 4 },
  moveOptionBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  moveOptionText: { color: P.white, fontWeight: '900', fontSize: 11, letterSpacing: 1.5 },
  hintBox: { marginTop: 8, width: '100%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5 },
  hintText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  phiTable: { marginTop: 12, width: '100%', backgroundColor: P.creamLt, borderRadius: 14, borderWidth: 1.5, borderColor: P.creamDk, padding: 12 },
  phiTableTitle: { fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  phiTableRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  phiPairItem: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  phiPairText: { fontSize: 11, fontWeight: '900' },
  msgBox: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, width: '100%' },
  msgText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, width: '100%' },
  hintToggle: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  hintToggleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  resetBtn: { flex: 2, paddingVertical: 13, borderRadius: 14, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, shadowOpacity: 0.35, elevation: 6 },
  resetBtnText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
  ytBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  ytBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  presetBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  presetBtnText: { fontSize: 11, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(46,58,78,0.72)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 320, backgroundColor: P.creamLt, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  modalTitle: { fontWeight: '900', fontSize: 17, letterSpacing: 3, color: P.ink, marginBottom: 6 },
  modalBody: { fontSize: 13, color: '#525e75', textAlign: 'left', lineHeight: 21, width: '100%' },
  ytBtnModal: { paddingVertical: 10, borderRadius: 10, width: '100%', alignItems: 'center' },
  ytBtnModalText: { color: P.white, fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  modalClose: { paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalCloseText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
});
