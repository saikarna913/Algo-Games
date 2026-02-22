// src/core/components/GlobalFooter.tsx
// Fixed footer visible across all screens.
// Shows live scores for both players + combined total.
// Reads from global Zustand store — automatically updates when any game awards points.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../theme';
import { useGameStore, selectCombinedScore, selectMultiplayerTotal } from '../store';

interface GlobalFooterProps {
  onDonatePress: () => void;
}

export default function GlobalFooter({ onDonatePress }: GlobalFooterProps) {
  const insets = useSafeAreaInsets();
  const playerRed = useGameStore((s) => s.playerRed);
  const playerBlue = useGameStore((s) => s.playerBlue);
  const mode = useGameStore((s) => s.mode);
  const multiplayerPlayers = useGameStore((s) => s.multiplayerPlayers);
  const combined = useGameStore(selectCombinedScore);
  const multiTotal = useGameStore(selectMultiplayerTotal);
  const resetScores = useGameStore((s) => s.resetScores);

  const isMultiplayer = mode === 'multiplayer';

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 4 }]}>
      {isMultiplayer ? (
        // ── Multiplayer Footer ────────────────────────────────────────────────
        <View style={styles.inner}>
          <View style={styles.multiRow}>
            {multiplayerPlayers.slice(0, 4).map((player) => (
              <View key={player.id} style={[styles.playerChip, { borderColor: player.color }]}>
                <Text style={[styles.playerChipName, { color: player.color }]} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={[styles.playerChipScore, { color: player.color }]}>
                  {player.score}
                </Text>
              </View>
            ))}
            {multiplayerPlayers.length === 0 && (
              <Text style={styles.noPlayersText}>No players yet</Text>
            )}
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalScore}>{multiTotal}</Text>
          </View>
        </View>
      ) : (
        // ── Two-Player Footer ─────────────────────────────────────────────────
        <View style={styles.inner}>
          {/* Red player score */}
          <View style={[styles.playerScore, styles.playerScoreRed]}>
            <View style={[styles.playerDot, { backgroundColor: Colors.playerRed }]} />
            <Text style={[styles.playerName, { color: Colors.playerRed }]}>Red</Text>
            <Text style={[styles.score, { color: Colors.playerRed }]}>{playerRed.score}</Text>
          </View>

          {/* Center: combined score + donate button */}
          <View style={styles.center}>
            <Text style={styles.combinedLabel}>Combined</Text>
            <Text style={styles.combinedScore}>{combined}</Text>
            <TouchableOpacity onPress={onDonatePress} style={styles.donateBtn}>
              <Text style={styles.donateBtnText}>☕ Donate ₹10</Text>
            </TouchableOpacity>
          </View>

          {/* Blue player score */}
          <View style={[styles.playerScore, styles.playerScoreBlue]}>
            <View style={[styles.playerDot, { backgroundColor: Colors.playerBlue }]} />
            <Text style={[styles.playerName, { color: Colors.playerBlue }]}>Blue</Text>
            <Text style={[styles.score, { color: Colors.playerBlue }]}>{playerBlue.score}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.midnightNavy,
    ...Shadow.lg,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
    zIndex: 100,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // ── Two-player layout ──────────────────────────────────────────────────────
  playerScore: {
    alignItems: 'center',
    gap: 2,
  },
  playerScoreRed: { flex: 1, alignItems: 'flex-start' },
  playerScoreBlue: { flex: 1, alignItems: 'flex-end' },
  playerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playerName: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  score: {
    fontSize: FontSize['2xl'],
    fontWeight: 'bold',
    lineHeight: 28,
  },
  center: {
    alignItems: 'center',
    gap: 2,
  },
  combinedLabel: {
    fontSize: FontSize.xs,
    color: Colors.white,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  combinedScore: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.white,
  },
  donateBtn: {
    backgroundColor: Colors.deepTeal,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginTop: 2,
  },
  donateBtnText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700',
  },
  // ── Multiplayer layout ─────────────────────────────────────────────────────
  multiRow: {
    flexDirection: 'row',
    flex: 1,
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  playerChipName: {
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 50,
  },
  playerChipScore: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  noPlayersText: {
    color: Colors.white,
    opacity: 0.5,
    fontSize: FontSize.sm,
  },
  footerRight: {
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSize.xs,
    color: Colors.white,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  totalScore: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
