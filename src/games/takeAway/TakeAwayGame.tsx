// src/games/takeAway/TakeAwayGame.tsx
// CS Concept: Modular arithmetic — multiples of 4 are losing positions

import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking } from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { useGameStore } from '../../core/store';
import {
  createInitialState, applyMove, resetState,
  isLosingPosition, optimalMove, PILE_OPTIONS, TakeAwayState,
} from './takeAwayLogic';
import type { GameScreenProps } from '../registry';

const P = {
  creamLt: '#faf3e8', creamDk: '#e8ceaa', ink: '#2e3a4e', slateLt: '#8292ae',
  red: '#b84c2e', redLight: '#f2e0d5', redMid: '#dba08a',
  blue: '#2980b9', blueLight: '#eaf4fb', blueMid: '#aed6f1',
  teal: '#78938a', amber: '#c47b3a', green: '#4a7a4a', white: '#fff',
  stone: '#c8b89a', stoneDk: '#a89070',
};
const YOUTUBE_URL = 'https://www.youtube.com/@DrukenCoder';

interface ExtendedProps extends GameScreenProps {
  onPlayerChange?: (p: 0 | 1) => void;
  accentColor?: string;
}

function Stone({ size = 20, faded = false, color = P.stone }: { size?: number; faded?: boolean; color?: string }) {
  return (
    <View style={{
      width: size, height: size * 0.85, borderRadius: size * 0.42,
      backgroundColor: faded ? 'transparent' : color,
      borderWidth: 1.5, borderColor: faded ? P.creamDk + '66' : P.stoneDk,
      borderStyle: faded ? 'dashed' : 'solid',
      margin: 3, opacity: faded ? 0.3 : 1,
      shadowColor: '#0003', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: faded ? 0 : 0.2, shadowRadius: 2, elevation: faded ? 0 : 1,
    }}>
      {!faded && <View style={{ position: 'absolute', top: 3, left: 4, width: size * 0.3, height: size * 0.2, borderRadius: size * 0.1, backgroundColor: '#ffffff55' }} />}
    </View>
  );
}

export default forwardRef(function TakeAwayGame(
  { mode, onGameEnd, onExit, showHeader = true, onPlayerChange, accentColor }: ExtendedProps, ref
) {
  const [state, setState] = useState<TakeAwayState>(() => createInitialState());
  const [selected, setSelected] = useState<number | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const addScore = useGameStore(s => s.addScore);

  const isRed = state.currentPlayer === 0;
  const activeCol = isRed ? P.red : P.blue;
  const activeBg = isRed ? P.redLight : P.blueLight;

  useEffect(() => { onPlayerChange?.(state.currentPlayer); }, [state.currentPlayer]);

  const handleMove = useCallback((n: number) => {
    if (state.gameOver) return;
    const newState = applyMove(state, n);
    setState(newState);
    setSelected(null);
    if (newState.gameOver && newState.winner) {
      addScore(newState.winner, 1);
      setTimeout(() => onGameEnd(newState.winner!), 600);
    }
  }, [state]);

  const handleReset = useCallback((pile?: number) => {
    setState(resetState(pile));
    setSelected(null);
    onPlayerChange?.(0);
  }, []);

  useImperativeHandle(ref, () => ({ reset: () => handleReset() }));

  const hint = optimalMove(state.pile);
  const losing = isLosingPosition(state.pile);

  // Stone grid — show pile, grey out "selected" ones
  const stoneRows = Math.ceil(state.pile / 10);
  const playerLabel = state.gameOver
    ? `${state.winner?.toUpperCase()} WINS!`
    : `${isRed ? 'RED' : 'BLUE'}'S TURN`;

  return (
    <View style={[styles.container, { backgroundColor: activeBg }]}>
      {showHeader && <GameHeader title="Take Away" onBack={onExit} onInfo={() => setInfoVisible(true)} accentColor={accentColor ?? activeCol} />}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { borderColor: activeCol + '55', backgroundColor: activeCol + '18' }]}>
          <Text style={[styles.bannerText, { color: activeCol }]}>{playerLabel}</Text>
          <Text style={[styles.subText, { color: P.slateLt }]}>STONES LEFT: {state.pile}</Text>
        </View>

        <View style={styles.scoreRow}>
          <View style={[styles.scoreBox, { borderColor: P.red + '66', backgroundColor: isRed ? P.redMid : P.creamLt }]}>
            <Text style={[styles.scoreLabel, { color: P.red }]}>RED</Text>
            <Text style={[styles.scoreNum, { color: P.red }]}>{state.scores[0]}</Text>
          </View>
          <View style={[styles.modBadge, { borderColor: losing ? P.red + '88' : P.green + '88', backgroundColor: losing ? P.red + '18' : P.green + '18' }]}>
            <Text style={[styles.modNum, { color: losing ? P.red : P.green }]}>{state.pile} % 4</Text>
            <Text style={[styles.modVal, { color: losing ? P.red : P.green }]}>= {state.pile % 4}</Text>
            <Text style={[styles.modLabel, { color: losing ? P.red : P.green }]}>{losing ? 'LOSE' : 'WIN'}</Text>
          </View>
          <View style={[styles.scoreBox, { borderColor: P.blue + '66', backgroundColor: !isRed ? P.blueMid : P.creamLt }]}>
            <Text style={[styles.scoreLabel, { color: P.blue }]}>BLUE</Text>
            <Text style={[styles.scoreNum, { color: P.blue }]}>{state.scores[1]}</Text>
          </View>
        </View>

        {/* Stone pile visualisation */}
        <View style={[styles.pileBox, { borderColor: activeCol + '44' }]}>
          <Text style={[styles.pileLabel, { color: P.slateLt }]}>PILE</Text>
          <View style={styles.stonesGrid}>
            {Array.from({ length: state.originalPile }).map((_, i) => {
              const removed = i >= state.pile;
              const highlighted = selected !== null && i >= state.pile - selected && i < state.pile;
              return (
                <Stone
                  key={i}
                  size={state.originalPile > 15 ? 16 : 20}
                  faded={removed}
                  color={highlighted ? activeCol : P.stone}
                />
              );
            })}
          </View>
        </View>

        {/* Remove buttons */}
        {!state.gameOver && (
          <View style={styles.moveRow}>
            {[1, 2, 3].map(n => {
              const canRemove = n <= state.pile;
              const isHint = state.showHint && hint === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.moveBtn,
                    { borderColor: isHint ? P.amber : activeCol + '88', backgroundColor: selected === n ? activeCol : P.creamLt },
                    !canRemove && styles.moveBtnDisabled,
                    isHint && { borderWidth: 2.5, borderColor: P.amber },
                  ]}
                  onPress={() => { setSelected(n); handleMove(n); }}
                  disabled={!canRemove}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.moveBtnNum, { color: selected === n ? P.white : activeCol, opacity: canRemove ? 1 : 0.3 }]}>{n}</Text>
                  <Text style={[styles.moveBtnLabel, { color: selected === n ? P.white + 'cc' : P.slateLt, opacity: canRemove ? 1 : 0.3 }]}>
                    {n === 1 ? 'STONE' : 'STONES'}
                  </Text>
                  {isHint && <View style={[styles.hintDot, { backgroundColor: P.amber }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Hint */}
        {state.showHint && !state.gameOver && (
          <View style={[styles.hintBox, { borderColor: P.amber + '88', backgroundColor: P.amber + '11' }]}>
            <Text style={[styles.hintText, { color: P.amber }]}>
              {hint
                ? `💡 Remove ${hint} → leaves ${state.pile - hint} (multiple of 4) — opponent loses`
                : `💡 You're already losing. Any move your opponent can counter.`}
            </Text>
          </View>
        )}

        <View style={[styles.msgBox, { backgroundColor: activeCol + '11', borderColor: activeCol + '33' }]}>
          <Text style={[styles.msgText, { color: P.ink }]}>{state.message}</Text>
        </View>

        {/* Mod-4 ladder */}
        <View style={styles.ladderBox}>
          <Text style={[styles.ladderTitle, { color: P.slateLt }]}>MULTIPLES OF 4 = LOSING</Text>
          <View style={styles.ladderRow}>
            {[4, 8, 12, 16, 20].map(n => (
              <View key={n} style={[styles.ladderItem,
                { backgroundColor: state.pile === n ? P.red + '33' : P.creamLt, borderColor: state.pile === n ? P.red : P.creamDk }]}>
                <Text style={[styles.ladderNum, { color: state.pile === n ? P.red : P.slateLt }]}>{n}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Move history */}
        {state.moveHistory.length > 0 && (
          <View style={styles.historyBox}>
            <Text style={[styles.historyTitle, { color: P.slateLt }]}>MOVE HISTORY</Text>
            {state.moveHistory.slice(-6).map((m, i) => (
              <View key={i} style={styles.historyRow}>
                <View style={[styles.historyDot, { backgroundColor: m.player === 0 ? P.red : P.blue }]} />
                <Text style={[styles.historyText, { color: P.ink }]}>
                  {m.player === 0 ? 'Red' : 'Blue'} removed {m.removed} → {m.remaining} left
                  {m.remaining % 4 === 0 ? '  ⚠' : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.hintToggle, { borderColor: P.amber + '88', backgroundColor: state.showHint ? P.amber + '22' : P.creamLt }]}
            onPress={() => setState(s => ({ ...s, showHint: !s.showHint }))}>
            <Text style={[styles.hintToggleText, { color: P.amber }]}>{state.showHint ? '▼ HINT ON' : '▶ HINT'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.resetBtn, { backgroundColor: activeCol, shadowColor: activeCol }]} onPress={() => handleReset()} activeOpacity={0.82}>
            <Text style={styles.resetBtnText}>↺  RESET</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ytBtn, { borderColor: P.amber + '88' }]} onPress={() => Linking.openURL(YOUTUBE_URL)}>
            <Text style={[styles.ytBtnText, { color: P.amber }]}>▶ YT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pilePickRow}>
          {PILE_OPTIONS.map(n => (
            <TouchableOpacity key={n} style={[styles.pilePickBtn, { borderColor: P.teal + '66', backgroundColor: state.originalPile === n ? P.teal + '33' : P.creamLt }]}
              onPress={() => handleReset(n)}>
              <Text style={[styles.pilePickText, { color: P.teal }]}>N={n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>TAKE AWAY</Text>
            <Text style={styles.modalBody}>
              {'🧠 CS CONCEPT: Modular Arithmetic\n\n'}
              {'ONE pile, N stones. Remove 1, 2, or 3 per turn.\nLast stone wins.\n\n'}
              {'THE KEY: Multiples of 4 are losing positions!\n\n'}
              {'STRATEGY: Always leave a multiple of 4.\n'}
              {'  N=10 → remove 2 → leaves 8 ✓\n'}
              {'  N=8  → remove ? → 4 stays ✓\n\n'}
              {'WHY? Any move from a multiple of 4 leaves\n1,2,3 stones — opponent restores the multiple.'}
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
  container: { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: 32, paddingHorizontal: 16 },
  banner: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', width: '100%' },
  bannerText: { fontWeight: '900', fontSize: 13, letterSpacing: 3 },
  subText: { fontSize: 9, letterSpacing: 2, marginTop: 2, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', gap: 10, marginTop: 10, width: '100%', alignItems: 'center' },
  scoreBox: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 8, alignItems: 'center' },
  scoreLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  scoreNum: { fontSize: 24, fontWeight: '900' },
  modBadge: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 6, alignItems: 'center' },
  modNum: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  modVal: { fontSize: 20, fontWeight: '900' },
  modLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  pileBox: { marginTop: 14, width: '100%', backgroundColor: P.creamLt, borderRadius: 16, borderWidth: 1.5, padding: 14, alignItems: 'center' },
  pileLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 2.5, marginBottom: 10 },
  stonesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  moveRow: { flexDirection: 'row', gap: 12, marginTop: 14, width: '100%' },
  moveBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 16, alignItems: 'center', backgroundColor: P.creamLt },
  moveBtnDisabled: { opacity: 0.4 },
  moveBtnNum: { fontSize: 28, fontWeight: '900' },
  moveBtnLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: 2 },
  hintDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', top: 6, right: 6 },
  hintBox: { marginTop: 8, width: '100%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5 },
  hintText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  msgBox: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, width: '100%' },
  msgText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  ladderBox: { marginTop: 12, width: '100%', backgroundColor: P.creamLt, borderRadius: 14, borderWidth: 1.5, borderColor: P.creamDk, padding: 12 },
  ladderTitle: { fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  ladderRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  ladderItem: { width: 38, height: 38, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  ladderNum: { fontSize: 13, fontWeight: '900' },
  historyBox: { marginTop: 10, width: '100%', backgroundColor: P.creamLt, borderRadius: 14, borderWidth: 1.5, borderColor: P.creamDk, padding: 12 },
  historyTitle: { fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyText: { fontSize: 11, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, width: '100%' },
  hintToggle: { flex: 1.5, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  hintToggleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  resetBtn: { flex: 2, paddingVertical: 13, borderRadius: 14, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, shadowOpacity: 0.35, elevation: 6 },
  resetBtnText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
  ytBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  ytBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  pilePickRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  pilePickBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  pilePickText: { fontSize: 11, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(46,58,78,0.72)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 320, backgroundColor: P.creamLt, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  modalTitle: { fontWeight: '900', fontSize: 17, letterSpacing: 3, color: P.ink, marginBottom: 6 },
  modalBody: { fontSize: 13, color: '#525e75', textAlign: 'left', lineHeight: 21, width: '100%' },
  ytBtnModal: { paddingVertical: 10, borderRadius: 10, width: '100%', alignItems: 'center' },
  ytBtnModalText: { color: P.white, fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  modalClose: { paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalCloseText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
});
