// src/games/knightGame/KnightGame.tsx
// CS Concept: Grundy Numbers + DP on chess knight movement

import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking, useWindowDimensions } from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { useGameStore } from '../../core/store';
import {
  createInitialState, applyMove, resetState,
  BOARD_ROWS, BOARD_COLS, KnightState,
} from './knightGameLogic';
import type { GameScreenProps } from '../registry';

const P = {
  creamLt: '#faf3e8', creamDk: '#e8ceaa', ink: '#2e3a4e', slateLt: '#8292ae',
  red: '#b84c2e', redLight: '#f2e0d5', redMid: '#dba08a',
  blue: '#2980b9', blueLight: '#eaf4fb', blueMid: '#aed6f1',
  teal: '#78938a', amber: '#c47b3a', green: '#4a7a4a', white: '#fff',
  boardLight: '#f5ead8', boardDark: '#d4b896',
};
const YOUTUBE_URL = 'https://www.youtube.com/@DrukenCoder';

interface ExtendedProps extends GameScreenProps {
  onPlayerChange?: (p: 0 | 1) => void;
  accentColor?: string;
}

export default forwardRef(function KnightGame(
  { mode, onGameEnd, onExit, showHeader = true, onPlayerChange, accentColor }: ExtendedProps, ref
) {
  const [state, setState] = useState<KnightState>(() => createInitialState());
  const [infoVisible, setInfoVisible] = useState(false);
  const addScore = useGameStore(s => s.addScore);
  const { width } = useWindowDimensions();

  const isRed = state.currentPlayer === 0;
  const activeCol = isRed ? P.red : P.blue;
  const activeBg = isRed ? P.redLight : P.blueLight;
  const cellSize = Math.min((width - 48) / BOARD_COLS, 62);

  useEffect(() => { onPlayerChange?.(state.currentPlayer); }, [state.currentPlayer]);

  const handleCellPress = useCallback((r: number, c: number) => {
    if (state.gameOver) return;
    const newState = applyMove(state, [r, c]);
    setState(newState);
    if (newState.gameOver && newState.winner) {
      addScore(newState.winner, 1);
      setTimeout(() => onGameEnd(newState.winner!), 600);
    }
  }, [state]);

  const handleReset = useCallback((pos?: [number, number]) => {
    setState(resetState(pos));
    onPlayerChange?.(0);
  }, []);

  useImperativeHandle(ref, () => ({ reset: () => handleReset() }));

  const validSet = new Set(state.validMoves.map(([r, c]) => `${r},${c}`));
  const visitedSet = new Set(state.visitedCells.map(([r, c]) => `${r},${c}`));

  const playerLabel = state.gameOver
    ? `${state.winner?.toUpperCase()} WINS!`
    : `${isRed ? 'RED' : 'BLUE'}'S TURN`;

  return (
    <View style={[styles.container, { backgroundColor: activeBg }]}>
      {showHeader && <GameHeader title="Knight Game" onBack={onExit} onInfo={() => setInfoVisible(true)} accentColor={accentColor ?? activeCol} />}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { borderColor: activeCol + '55', backgroundColor: activeCol + '18' }]}>
          <Text style={[styles.bannerText, { color: activeCol }]}>{playerLabel}</Text>
          <Text style={[styles.subText, { color: P.slateLt }]}>
            GRUNDY({state.knightPos[0]},{state.knightPos[1]}) = {state.grundyGrid[state.knightPos[0]][state.knightPos[1]]}
          </Text>
        </View>

        <View style={styles.scoreRow}>
          <View style={[styles.scoreBox, { borderColor: P.red + '66', backgroundColor: isRed ? P.redMid : P.creamLt }]}>
            <Text style={[styles.scoreLabel, { color: P.red }]}>RED</Text>
            <Text style={[styles.scoreNum, { color: P.red }]}>{state.scores[0]}</Text>
          </View>
          <View style={[styles.grundyBadge, { borderColor: state.grundyGrid[state.knightPos[0]][state.knightPos[1]] === 0 ? P.red + '88' : P.green + '88', backgroundColor: state.grundyGrid[state.knightPos[0]][state.knightPos[1]] === 0 ? P.red + '18' : P.green + '18' }]}>
            <Text style={[styles.grundyLabel, { color: state.grundyGrid[state.knightPos[0]][state.knightPos[1]] === 0 ? P.red : P.green }]}>
              G={state.grundyGrid[state.knightPos[0]][state.knightPos[1]]}
            </Text>
            <Text style={[styles.grundyStatus, { color: state.grundyGrid[state.knightPos[0]][state.knightPos[1]] === 0 ? P.red : P.green }]}>
              {state.grundyGrid[state.knightPos[0]][state.knightPos[1]] === 0 ? 'LOSE' : 'WIN'}
            </Text>
          </View>
          <View style={[styles.scoreBox, { borderColor: P.blue + '66', backgroundColor: !isRed ? P.blueMid : P.creamLt }]}>
            <Text style={[styles.scoreLabel, { color: P.blue }]}>BLUE</Text>
            <Text style={[styles.scoreNum, { color: P.blue }]}>{state.scores[1]}</Text>
          </View>
        </View>

        {/* Board */}
        <View style={[styles.board, { borderColor: activeCol + '44' }]}>
          {Array.from({ length: BOARD_ROWS }).map((_, r) => (
            <View key={r} style={styles.boardRow}>
              {Array.from({ length: BOARD_COLS }).map((_, c) => {
                const isKnight = state.knightPos[0] === r && state.knightPos[1] === c;
                const isValid = validSet.has(`${r},${c}`);
                const isVisited = visitedSet.has(`${r},${c}`) && !isKnight;
                const isLight = (r + c) % 2 === 0;
                const g = state.grundyGrid[r][c];

                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => handleCellPress(r, c)}
                    style={[
                      styles.cell,
                      { width: cellSize, height: cellSize, backgroundColor: isKnight ? activeCol : isValid ? activeCol + '33' : isVisited ? P.slateLt + '33' : isLight ? P.boardLight : P.boardDark },
                      isValid && { borderColor: activeCol, borderWidth: 2 },
                      isKnight && { borderColor: activeCol, borderWidth: 2.5 },
                    ]}
                    activeOpacity={isValid ? 0.7 : 1}
                    disabled={!isValid && !isKnight}
                  >
                    {isKnight && (
                      <Text style={{ fontSize: cellSize * 0.5, lineHeight: cellSize * 0.55 }}>♞</Text>
                    )}
                    {!isKnight && state.showGrundy && (
                      <Text style={[styles.cellGrundy, { color: g === 0 ? P.red : P.teal, fontSize: cellSize * 0.28 }]}>{g}</Text>
                    )}
                    {isVisited && !isKnight && (
                      <View style={[styles.visitedDot, { backgroundColor: isRed ? P.redMid : P.blueMid }]} />
                    )}
                    {isValid && (
                      <View style={[styles.validDot, { backgroundColor: activeCol + 'cc' }]} />
                    )}
                    {/* Coord */}
                    <Text style={[styles.cellCoord, { color: isKnight ? P.white + '99' : P.slateLt + '88' }]}>{r},{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Grundy toggle */}
        <TouchableOpacity
          style={[styles.grundyToggle, { borderColor: P.amber + '88', backgroundColor: state.showGrundy ? P.amber + '22' : P.creamLt }]}
          onPress={() => setState(s => ({ ...s, showGrundy: !s.showGrundy }))}>
          <Text style={[styles.grundyToggleText, { color: P.amber }]}>
            {state.showGrundy ? '▼ HIDE GRUNDY' : '▶ SHOW GRUNDY NUMBERS'}
          </Text>
        </TouchableOpacity>

        {/* Grundy table legend */}
        {state.showGrundy && (
          <View style={styles.grundyLegend}>
            <Text style={[styles.legendTitle, { color: P.slateLt }]}>GRUNDY GRID (G=0 → losing)</Text>
            <View style={styles.grundyGrid}>
              {state.grundyGrid.map((row, r) => (
                <View key={r} style={styles.grundyRow}>
                  {row.map((g, c) => (
                    <View key={c} style={[styles.grundyCell, { backgroundColor: g === 0 ? P.red + '33' : P.green + '22', borderColor: g === 0 ? P.red + '55' : P.green + '44' }]}>
                      <Text style={[styles.grundyCellText, { color: g === 0 ? P.red : P.green }]}>{g}</Text>
                    </View>
                  ))}
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
            <Text style={[styles.ytBtnText, { color: P.amber }]}>▶  YOUTUBE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.startRow}>
          {([[4,0],[3,1],[0,0],[2,2]] as [number,number][]).map(([r,c]) => (
            <TouchableOpacity key={`${r}${c}`} style={[styles.startBtn, { borderColor: P.teal + '66' }]} onPress={() => handleReset([r,c])}>
              <Text style={[styles.startBtnText, { color: P.teal }]}>Start ({r},{c})</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>KNIGHT GAME</Text>
            <Text style={styles.modalBody}>
              {'🧠 CS CONCEPT: Grundy Numbers + DP\n\n'}
              {'A knight starts on the board. Players alternate moving it (L-shape). Visited cells are blocked. Player who CANNOT move loses.\n\n'}
              {'GRUNDY NUMBER:\n'}
              {'  G(cell) = mex{ G(reachable cells) }\n'}
              {'  mex = minimum excluded integer\n\n'}
              {'G = 0 → losing position for current player\n'}
              {'G ≠ 0 → winning position\n\n'}
              {'Tap "SHOW GRUNDY" to see the full grid!'}
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
  grundyBadge: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 6, alignItems: 'center' },
  grundyLabel: { fontSize: 18, fontWeight: '900' },
  grundyStatus: { fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  board: { marginTop: 14, borderRadius: 12, borderWidth: 2, overflow: 'hidden', shadowColor: '#2e3a4e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 14, elevation: 8 },
  boardRow: { flexDirection: 'row' },
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#00000022', position: 'relative' },
  cellGrundy: { fontWeight: '900', position: 'absolute', top: 3, left: 4 },
  cellCoord: { position: 'absolute', bottom: 1, right: 2, fontSize: 7, fontWeight: '600' },
  visitedDot: { width: 8, height: 8, borderRadius: 4 },
  validDot: { width: 10, height: 10, borderRadius: 5, position: 'absolute' },
  grundyToggle: { marginTop: 12, width: '100%', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  grundyToggleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  grundyLegend: { marginTop: 10, width: '100%', backgroundColor: P.creamLt, borderRadius: 14, borderWidth: 1.5, borderColor: P.creamDk, padding: 12 },
  legendTitle: { fontSize: 8, fontWeight: '900', letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  grundyGrid: { gap: 3 },
  grundyRow: { flexDirection: 'row', gap: 3 },
  grundyCell: { flex: 1, height: 28, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  grundyCellText: { fontSize: 12, fontWeight: '900' },
  msgBox: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, width: '100%' },
  msgText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, width: '100%' },
  resetBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, shadowOpacity: 0.35, elevation: 6 },
  resetBtnText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
  ytBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  ytBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  startRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  startBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  startBtnText: { fontSize: 10, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(46,58,78,0.72)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: 320, backgroundColor: P.creamLt, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  modalTitle: { fontWeight: '900', fontSize: 17, letterSpacing: 3, color: P.ink, marginBottom: 6 },
  modalBody: { fontSize: 13, color: '#525e75', textAlign: 'left', lineHeight: 21, width: '100%' },
  ytBtnModal: { paddingVertical: 10, borderRadius: 10, width: '100%', alignItems: 'center' },
  ytBtnModalText: { color: P.white, fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  modalClose: { paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalCloseText: { color: P.white, fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
});
