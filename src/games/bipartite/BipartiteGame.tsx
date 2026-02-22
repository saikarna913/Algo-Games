// src/games/bipartite/BipartiteGame.tsx
// Bipartite Graph Coloring Game — React Native component.
// Renders an interactive SVG graph where players color nodes.

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadow } from '../../core/theme';
import { useGameStore } from '../../core/store';
import {
  BipartiteState,
  createInitialState,
  applyMove,
  isValidMove,
  getValidMoves,
  GRAPH_PRESETS,
} from './bipartiteLogic';
import type { GameScreenProps } from '../registry';

// ─── Constants ────────────────────────────────────────────────────────────────

const GRAPH_SIZE = Math.min(Dimensions.get('window').width - 32, 380);
const NODE_RADIUS = 22;

const PLAYER_COLORS = {
  0: Colors.playerRed,    // Red player
  1: Colors.playerBlue,   // Blue player
};

const PLAYER_LABELS = { 0: 'Red', 1: 'Blue' };

// ─── Component ────────────────────────────────────────────────────────────────

export default function BipartiteGame({ mode, onGameEnd, onExit }: GameScreenProps) {
  const [state, setState] = useState<BipartiteState>(() => createInitialState(0));
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [invalidFlash, setInvalidFlash] = useState<number | null>(null);
  const addScore = useGameStore((s) => s.addScore);

  // Animated value for the turn indicator pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Pulse animation on turn change ─────────────────────────────────────────
  const pulseTurnIndicator = useCallback(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [pulseAnim]);

  // ── Handle node press ───────────────────────────────────────────────────────
  const handleNodePress = useCallback(
    (nodeId: number) => {
      if (state.gameOver) return;

      const playerColor = state.currentPlayer;
      const valid = isValidMove(nodeId, playerColor, state.nodes, state.edges);

      if (!valid) {
        // Flash the node to show invalid move
        setInvalidFlash(nodeId);
        setTimeout(() => setInvalidFlash(null), 500);
        return;
      }

      const newState = applyMove(state, nodeId);
      setState(newState);
      pulseTurnIndicator();

      // Game over — update global scores and notify parent
      if (newState.gameOver && newState.winner) {
        if (newState.winner !== 'draw') {
          addScore(newState.winner as 'red' | 'blue', 1);
        }
        setTimeout(() => {
          onGameEnd(newState.winner!);
        }, 800);
      }
    },
    [state, addScore, onGameEnd, pulseTurnIndicator]
  );

  // ── Reset game ──────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setState(createInitialState(selectedPreset));
  }, [selectedPreset]);

  // ── Switch preset ───────────────────────────────────────────────────────────
  const handlePresetChange = useCallback((idx: number) => {
    setSelectedPreset(idx);
    setState(createInitialState(idx));
  }, []);

  // ── Render SVG graph ────────────────────────────────────────────────────────
  const renderGraph = () => {
    const validMoves = state.gameOver
      ? []
      : getValidMoves(state.currentPlayer, state.nodes, state.edges);

    return (
      <Svg width={GRAPH_SIZE} height={GRAPH_SIZE} style={styles.svg}>
        {/* Render edges first (behind nodes) */}
        {state.edges.map((edge, idx) => {
          const from = state.nodes[edge.from];
          const to = state.nodes[edge.to];
          return (
            <Line
              key={`edge-${idx}`}
              x1={from.x * GRAPH_SIZE}
              y1={from.y * GRAPH_SIZE}
              x2={to.x * GRAPH_SIZE}
              y2={to.y * GRAPH_SIZE}
              stroke={Colors.border}
              strokeWidth={2}
            />
          );
        })}

        {/* Render nodes */}
        {state.nodes.map((node) => {
          const cx = node.x * GRAPH_SIZE;
          const cy = node.y * GRAPH_SIZE;
          const isValid = validMoves.includes(node.id);
          const isLastMoved = state.lastMovedNode === node.id;
          const isFlashing = invalidFlash === node.id;

          // Determine fill color
          let fillColor = Colors.nodeEmpty;
          if (node.color === 0) fillColor = Colors.playerRed;
          else if (node.color === 1) fillColor = Colors.playerBlue;
          else if (isFlashing) fillColor = Colors.error;
          else if (isValid) fillColor = Colors.lightBlue;

          return (
            <React.Fragment key={`node-${node.id}`}>
              {/* Outer ring for valid/last-moved highlight */}
              {(isValid || isLastMoved) && (
                <Circle
                  cx={cx}
                  cy={cy}
                  r={NODE_RADIUS + 5}
                  fill="none"
                  stroke={isLastMoved ? Colors.deepTeal : Colors.coastalBlue}
                  strokeWidth={2}
                  strokeDasharray={isValid ? '4 3' : undefined}
                  opacity={0.7}
                />
              )}

              {/* Main node circle */}
              <Circle
                cx={cx}
                cy={cy}
                r={NODE_RADIUS}
                fill={fillColor}
                stroke={isLastMoved ? Colors.deepTeal : Colors.midnightNavy}
                strokeWidth={isLastMoved ? 2.5 : 1.5}
                onPress={() => handleNodePress(node.id)}
              />

              {/* Node ID label */}
              <SvgText
                x={cx}
                y={cy + 5}
                textAnchor="middle"
                fill={node.color !== null ? Colors.white : Colors.midnightNavy}
                fontSize={12}
                fontWeight="bold"
                onPress={() => handleNodePress(node.id)}
              >
                {node.id}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.container} bounces={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onExit} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bipartite Coloring</Text>
      </View>

      {/* Turn Indicator */}
      {!state.gameOver ? (
        <Animated.View
          style={[
            styles.turnIndicator,
            { backgroundColor: PLAYER_COLORS[state.currentPlayer] },
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={styles.turnText}>
            {PLAYER_LABELS[state.currentPlayer]}'s Turn
          </Text>
        </Animated.View>
      ) : (
        <View
          style={[
            styles.turnIndicator,
            {
              backgroundColor:
                state.winner === 'draw'
                  ? Colors.textSecondary
                  : PLAYER_COLORS[state.winner === 'red' ? 0 : 1],
            },
          ]}
        >
          <Text style={styles.turnText}>
            {state.winner === 'draw'
              ? '🤝 Draw!'
              : `${state.winner === 'red' ? 'Red' : 'Blue'} Wins! 🎉`}
          </Text>
        </View>
      )}

      {/* Score Display */}
      <View style={styles.scoreRow}>
        <View style={[styles.scoreCard, { borderColor: Colors.playerRed }]}>
          <Text style={[styles.scoreLabel, { color: Colors.playerRed }]}>Red</Text>
          <Text style={[styles.scoreValue, { color: Colors.playerRed }]}>{state.scores[0]}</Text>
        </View>
        <View style={styles.scoreCenter}>
          <Text style={styles.scoreSeparator}>vs</Text>
        </View>
        <View style={[styles.scoreCard, { borderColor: Colors.playerBlue }]}>
          <Text style={[styles.scoreLabel, { color: Colors.playerBlue }]}>Blue</Text>
          <Text style={[styles.scoreValue, { color: Colors.playerBlue }]}>{state.scores[1]}</Text>
        </View>
      </View>

      {/* Graph Canvas */}
      <View style={styles.graphContainer}>{renderGraph()}</View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.lightBlue }]} />
          <Text style={styles.legendText}>Valid move</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.playerRed }]} />
          <Text style={styles.legendText}>Red</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.playerBlue }]} />
          <Text style={styles.legendText}>Blue</Text>
        </View>
      </View>

      {/* Preset Selector */}
      <View style={styles.presetRow}>
        <Text style={styles.presetLabel}>Graph:</Text>
        {GRAPH_PRESETS.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handlePresetChange(idx)}
            style={[
              styles.presetBtn,
              selectedPreset === idx && styles.presetBtnActive,
            ]}
          >
            <Text
              style={[
                styles.presetBtnText,
                selectedPreset === idx && styles.presetBtnTextActive,
              ]}
            >
              {idx + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>↺ Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Rules */}
      <View style={styles.rules}>
        <Text style={styles.rulesTitle}>📖 Rules</Text>
        <Text style={styles.rulesText}>
          Alternate turns coloring nodes. You cannot color a node the same color as any of its
          neighbors — this maintains the bipartite property. The player who colors more nodes wins!
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingBottom: 100,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    paddingRight: Spacing.md,
  },
  backBtnText: {
    fontSize: FontSize.md,
    color: Colors.coastalBlue,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.midnightNavy,
    textAlign: 'center',
    marginRight: 40,
  },
  turnIndicator: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.base,
    ...Shadow.md,
  },
  turnText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    gap: Spacing.md,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    ...Shadow.sm,
  },
  scoreLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: FontSize['3xl'],
    fontWeight: 'bold',
    lineHeight: 36,
  },
  scoreCenter: {
    alignItems: 'center',
  },
  scoreSeparator: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  graphContainer: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    overflow: 'hidden',
  },
  svg: {
    borderRadius: BorderRadius.lg,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginBottom: Spacing.base,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  presetLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  presetBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBg,
  },
  presetBtnActive: {
    backgroundColor: Colors.coastalBlue,
    borderColor: Colors.coastalBlue,
  },
  presetBtnText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  presetBtnTextActive: {
    color: Colors.white,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  resetBtn: {
    backgroundColor: Colors.deepTeal,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadow.sm,
  },
  resetBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rules: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    ...Shadow.sm,
  },
  rulesTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  rulesText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
