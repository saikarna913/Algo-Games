// src/games/stonePropagation/StonePropagationGame.tsx
// Stone Propagation game — animated chain-reaction stone placement.

import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  useWindowDimensions,
  Modal,
  Linking,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import GameHeader from '../../core/components/GameHeader';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../../core/theme';
import { useGameStore } from '../../core/store';
import {
  StoneState,
  createStoneInitialState,
  applyStoneMove,
  MAX_TURNS,
} from './stoneLogic';
import type { GameScreenProps } from '../registry';

// GRAPH size and node radius will be computed per-screen inside component

// ─── Component ────────────────────────────────────────────────────────────────

export default forwardRef(function StonePropagationGame({ mode, onGameEnd, onExit, showHeader = true }: GameScreenProps, ref) {
  const [state, setState] = useState<StoneState>(createStoneInitialState);
  const [infoVisible, setInfoVisible] = useState(false);
  const addScore = useGameStore((s) => s.addScore);

  const { width, height } = useWindowDimensions();
  const GRAPH_SIZE = Math.min(Math.max(200, width - 32), 420, Math.round(height * 0.6));
  const NODE_RADIUS = Math.max(10, Math.round(GRAPH_SIZE * 0.06));

  // Map of nodeId → Animated value for explosion scale effect
  const nodeScales = useRef<Record<number, Animated.Value>>({});
  const turnAnim = useRef(new Animated.Value(1)).current;

  // Initialize animation values for each node
  useEffect(() => {
    state.nodes.forEach((n) => {
      if (!nodeScales.current[n.id]) {
        nodeScales.current[n.id] = new Animated.Value(1);
      }
    });
  }, []);

  // ── Animate exploded nodes ──────────────────────────────────────────────────
  const animateExplosions = useCallback((explodedIds: number[]) => {
    if (explodedIds.length === 0) return;

    const animations = explodedIds.map((id) => {
      const anim = nodeScales.current[id];
      if (!anim) return Animated.delay(0);
      return Animated.sequence([
        Animated.timing(anim, { toValue: 1.6, duration: 150, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.8, duration: 100, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]);
    });

    Animated.parallel(animations).start();
  }, []);

  // ── Handle node press ───────────────────────────────────────────────────────
  const handleNodePress = useCallback(
    (nodeId: number) => {
      if (state.gameOver) return;

      const newState = applyStoneMove(state, nodeId);
      if (newState === state) return; // Invalid move

      setState(newState);
      animateExplosions(newState.lastExplodedNodes);

      // Pulse turn indicator
      Animated.sequence([
        Animated.timing(turnAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
        Animated.timing(turnAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();

      if (newState.gameOver && newState.winner) {
        if (newState.winner !== 'draw') {
          addScore(newState.winner as 'red' | 'blue', 1);
        }
        setTimeout(() => onGameEnd(newState.winner!), 800);
      }
    },
    [state, addScore, onGameEnd, animateExplosions, turnAnim]
  );

  const handleReset = useCallback(() => {
    setState(createStoneInitialState());
    Object.values(nodeScales.current).forEach((a) => a.setValue(1));
  }, []);

  useImperativeHandle(ref, () => ({ reset: () => handleReset() }));

  // ── Render graph ────────────────────────────────────────────────────────────
  const renderGraph = () => {
    return (
      <Svg width={GRAPH_SIZE} height={GRAPH_SIZE}>
        {/* Edges */}
        {state.edges.map((edge, idx) => {
          const from = state.nodes[edge.from];
          const to = state.nodes[edge.to];
          return (
            <Line
              key={idx}
              x1={from.x * GRAPH_SIZE}
              y1={from.y * GRAPH_SIZE}
              x2={to.x * GRAPH_SIZE}
              y2={to.y * GRAPH_SIZE}
              stroke={Colors.border}
              strokeWidth={2.5}
            />
          );
        })}

        {/* Nodes - rendered using SVG only; animation handled via React Native Animated overlay */}
        {state.nodes.map((node) => {
          const cx = node.x * GRAPH_SIZE;
          const cy = node.y * GRAPH_SIZE;

          // Node color based on owner
          let fillColor = Colors.nodeEmpty;
          if (node.owner === 'red') fillColor = '#FDDCDC';
          if (node.owner === 'blue') fillColor = '#D0E8FF';

          const strokeColor =
            node.owner === 'red'
              ? Colors.playerRed
              : node.owner === 'blue'
              ? Colors.playerBlue
              : Colors.border;

          // Danger indicator: node is near explosion
          const isDanger = node.stones >= 3;

          return (
            <React.Fragment key={node.id}>
              {/* Danger pulse ring */}
              {isDanger && (
                <Circle
                  cx={cx}
                  cy={cy}
                  r={NODE_RADIUS + 7}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  opacity={0.4}
                  strokeDasharray="3 3"
                />
              )}

              {/* Main circle */}
              <Circle
                cx={cx}
                cy={cy}
                r={NODE_RADIUS}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={2.5}
                onPress={() => handleNodePress(node.id)}
              />

              {/* Stone count */}
              <SvgText
                x={cx}
                y={cy - 3}
                textAnchor="middle"
                fill={Colors.midnightNavy}
                fontSize={16}
                fontWeight="bold"
                onPress={() => handleNodePress(node.id)}
              >
                {node.stones > 0 ? node.stones : ''}
              </SvgText>

              {/* Stone dots indicator */}
              {node.stones > 0 && (
                <SvgText
                  x={cx}
                  y={cy + 12}
                  textAnchor="middle"
                  fontSize={8}
                  fill={strokeColor}
                  onPress={() => handleNodePress(node.id)}
                >
                  {'●'.repeat(Math.min(node.stones, 4))}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    );
  };

  const turnsLeft = MAX_TURNS - state.turn;
  const playerColor = state.currentPlayer === 'red' ? Colors.playerRed : Colors.playerBlue;
  const bgForPlayer = state.currentPlayer === 'red' ? '#FFF2F2' : '#F0F7FF';

  const YT_LINK = 'https://www.youtube.com/results?search_query=chain+reaction+game+strategy';
  const ARTICLE_LINK = 'https://en.wikipedia.org/wiki/Chain_reaction_(game)';

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bgForPlayer }]} bounces={false}>
      {/* Header */}
      {showHeader !== false && (
        <GameHeader title="Stone Propagation" onBack={onExit} onInfo={() => setInfoVisible(true)} />
      )}

      {/* Turn Indicator */}
      {!state.gameOver ? (
        <Animated.View
          style={[
            styles.turnBadge,
            { backgroundColor: playerColor },
            { transform: [{ scale: turnAnim }] },
          ]}
        >
          <Text style={styles.turnText}>{state.currentPlayer === 'red' ? '🔴 Red' : '🔵 Blue'}'s Turn</Text>
          <Text style={styles.turnSubText}>Turn {state.turn + 1} / {MAX_TURNS}</Text>
        </Animated.View>
      ) : (
        <View
          style={[
            styles.turnBadge,
            {
              backgroundColor:
                state.winner === 'draw' ? Colors.textSecondary : (state.winner === 'red' ? Colors.playerRed : Colors.playerBlue),
            },
          ]}
        >
          <Text style={styles.turnText}>
            {state.winner === 'draw' ? '🤝 Draw!' : `${state.winner === 'red' ? '🔴 Red' : '🔵 Blue'} Wins!`}
          </Text>
        </View>
      )}

      {/* Scores */}
      <View style={styles.scoreRow}>
        <View style={[styles.scoreCard, { borderColor: Colors.playerRed }]}>
          <Text style={[styles.scoreName, { color: Colors.playerRed }]}>🔴 Red</Text>
          <Text style={[styles.scoreNum, { color: Colors.playerRed }]}>{state.scores.red}</Text>
          <Text style={styles.scoreSubLabel}>nodes</Text>
        </View>
        <View style={styles.middleInfo}>
          <Text style={styles.bombText}>💥</Text>
          <Text style={styles.turnsText}>{turnsLeft} turns left</Text>
        </View>
        <View style={[styles.scoreCard, { borderColor: Colors.playerBlue }]}>
          <Text style={[styles.scoreName, { color: Colors.playerBlue }]}>🔵 Blue</Text>
          <Text style={[styles.scoreNum, { color: Colors.playerBlue }]}>{state.scores.blue}</Text>
          <Text style={styles.scoreSubLabel}>nodes</Text>
        </View>
      </View>

      {/* Graph */}
      <View style={styles.graphContainer}>{renderGraph()}</View>

      {/* Tip */}
      <View style={styles.tip}>
        <Text style={styles.tipText}>
          💡 Tap any empty or your own node to place a stone.
          4 stones = explosion! Stones spread to neighbors.
        </Text>
      </View>

      {/* Reset */}
      <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
        <Text style={styles.resetText}>↺ New Game</Text>
      </TouchableOpacity>

      {/* Info Modal (GameCard-like) */}
      <Modal transparent visible={infoVisible} animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <View style={modalStyles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setInfoVisible(false)} activeOpacity={1} />
        </View>

        <View style={modalStyles.cardWrap}>
          <View style={modalStyles.card}>
            <View style={modalStyles.glow}>
              <Text style={modalStyles.icon}>💥</Text>
            </View>
            <Text style={modalStyles.modalTitle}>STONE PROPAGATION</Text>
            <Text style={modalStyles.modalSub}>STRATEGY & RULES</Text>

            <Text style={modalStyles.modalText}>
              Place stones on empty or your own nodes. When a node reaches 4 stones it explodes,
              sending one stone to each neighbour and converting them to your color. Chain
              reactions can sweep the board — plan to create cascades and control chokepoints.
            </Text>

            <View style={modalStyles.linkRow}>
              <TouchableOpacity style={[modalStyles.linkBtn, { backgroundColor: Colors.playerRed }]} onPress={() => Linking.openURL(YT_LINK)}>
                <Text style={modalStyles.linkText}>Watch Guide</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[modalStyles.linkBtn, { backgroundColor: Colors.playerBlue }]} onPress={() => Linking.openURL(ARTICLE_LINK)}>
                <Text style={modalStyles.linkText}>Read Article</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={modalStyles.closeBtn} onPress={() => setInfoVisible(false)}>
              <Text style={modalStyles.closeText}>← Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rules */}
      <View style={styles.rules}>
        <Text style={styles.rulesTitle}>📖 Rules</Text>
        <Text style={styles.rulesText}>
          Place stones on nodes you own or empty nodes. When a node accumulates 4 stones, it
          explodes — sending 1 stone to each neighbor and converting them to your color. Chain
          reactions cascade! Capture all opponent nodes or own the most after {MAX_TURNS} turns to win.
        </Text>
      </View>
    </ScrollView>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, alignItems: 'center', paddingBottom: 100 },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  backBtn: { paddingRight: Spacing.md },
  backBtnText: { fontSize: FontSize.md, color: Colors.coastalBlue, fontWeight: '600' },
  title: { flex: 1, fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.midnightNavy, textAlign: 'center', marginRight: 40 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, position: 'absolute', right: Spacing.base },
  smallIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.cardBg, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  smallIconText: { fontSize: 16 },
  infoBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.cardBg, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.xs, ...Shadow.sm },
  infoBtnText: { fontWeight: '700', color: Colors.midnightNavy },
  turnBadge: { paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, borderRadius: BorderRadius.full, marginBottom: Spacing.base, alignItems: 'center', ...Shadow.md },
  turnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: 'bold' },
  turnSubText: { color: Colors.white, fontSize: FontSize.sm, opacity: 0.85 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.base, gap: Spacing.md },
  scoreCard: { alignItems: 'center', backgroundColor: Colors.cardBg, borderRadius: BorderRadius.md, borderWidth: 2, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, ...Shadow.sm },
  scoreName: { fontSize: FontSize.sm, fontWeight: '700' },
  scoreNum: { fontSize: FontSize['3xl'], fontWeight: 'bold' },
  scoreSubLabel: { fontSize: FontSize.xs, color: Colors.textLight },
  middleInfo: { alignItems: 'center', gap: Spacing.xs },
  bombText: { fontSize: 28 },
  turnsText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  graphContainer: { backgroundColor: Colors.cardBg, borderRadius: BorderRadius.lg, ...Shadow.md, marginHorizontal: Spacing.base, marginBottom: Spacing.base, overflow: 'hidden' },
  tip: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  tipText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  resetBtn: { backgroundColor: Colors.deepTeal, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, borderRadius: BorderRadius.full, marginBottom: Spacing.base, ...Shadow.sm },
  resetText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  rules: { backgroundColor: Colors.cardBg, borderRadius: BorderRadius.md, padding: Spacing.base, marginHorizontal: Spacing.base, ...Shadow.sm },
  rulesTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  rulesText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});

const modalStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(38,70,83,0.6)' },
  cardWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: 320, backgroundColor: '#FBF7F3', borderRadius: 20, padding: 22, alignItems: 'center', shadowColor: Colors.midnightNavy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 20 },
  glow: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  icon: { fontSize: 40 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '900', letterSpacing: 2, marginTop: 2 },
  modalSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 12, marginTop: 6 },
  modalText: { fontSize: FontSize.sm, color: Colors.textPrimary, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  linkRow: { flexDirection: 'row', gap: Spacing.sm, width: '100%', justifyContent: 'space-between' },
  linkBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, marginHorizontal: 6, alignItems: 'center', shadowColor: Colors.midnightNavy, shadowOpacity: 0.14, shadowOffset: { width: 0, height: 6 }, shadowRadius: 10, elevation: 6 },
  linkText: { color: '#fff', fontWeight: '700' },
  closeBtn: { marginTop: 14, paddingVertical: 8 },
  closeText: { color: Colors.textSecondary, fontWeight: '700' },
});
