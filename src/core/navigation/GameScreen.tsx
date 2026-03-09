// src/core/navigation/GameScreen.tsx
// Container screen that loads any game from the registry by ID.
// This file never changes when new games are added — it's purely a shell.

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing } from '../theme';
import { useGameStore } from '../store';
import { getGameById } from '../../games/registry';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  Home: undefined;
  Game: { gameId: string; mode: 'two-player' | 'multiplayer' };
};

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
}

export default function GameScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { gameId, mode } = route.params;
  const addScore = useGameStore((s) => s.addScore);
  const setActiveGame = useGameStore((s) => s.setActiveGame);

  // Look up game in registry (kept for reference but not rendered here)
  const game = getGameById(gameId);

  // ── Handle game end ───────────────────────────────────────────────────────
  const handleGameEnd = useCallback(
    (winner: string) => {
      setActiveGame(null);

      // Default scoring: winner gets 1 point
      if (game?.onGameEnd) {
        game.onGameEnd(winner as 'red' | 'blue', addScore);
      }
      // Note: individual games also call addScore directly for more control

      Alert.alert(
        winner === 'draw' ? '🤝 Draw!' : `🎉 ${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!`,
        winner === 'draw'
          ? "It's a tie! Brilliant play from both sides."
          : `Congratulations ${winner}! Great game!`,
        [
          { text: '🔄 Play Again', onPress: () => {} }, // stays on screen, game resets internally
          { text: '🏠 Home', onPress: () => navigation.goBack() },
        ]
      );
    },
    [game, addScore, navigation, setActiveGame]
  );

  const handleExit = useCallback(() => {
    setActiveGame(null);
    navigation.goBack();
  }, [navigation, setActiveGame]);

  // ── Error state: game not found ───────────────────────────────────────────
  if (!game) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>🕹️</Text>
        <Text style={styles.errorText}>Game "{gameId}" not found in registry.</Text>
        <Text style={styles.errorSub}>Did you register it in src/games/registry.ts?</Text>
      </View>
    );
  }

  // Render header + the selected game component
  const GameComponent = game?.component;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}> 
      {/* Decorative orbs to match HomeScreen */}
      <View style={[styles.orb, styles.orbTopLeft]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbTopRight]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbMid]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbBottom]} pointerEvents="none" />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleExit} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {GameComponent ? (
        <View style={{ flex: 1, width: '100%' }}>
          <GameComponent mode={mode} onGameEnd={handleGameEnd} onExit={handleExit} />
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>🕹️</Text>
          <Text style={styles.errorText}>Game "{gameId}" not found.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8ceaa',
  },
  // Decorative orbs (copied from HomeScreen)
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbTopLeft: {
    width: 420,
    height: 420,
    top: -180,
    left: -160,
    backgroundColor: '#525e75',
    opacity: 0.14,
  },
  orbTopRight: {
    width: 340,
    height: 340,
    top: -100,
    right: -120,
    backgroundColor: '#92ba92',
    opacity: 0.18,
  },
  orbMid: {
    width: 300,
    height: 300,
    top: '38%',
    left: -140,
    backgroundColor: '#78938a',
    opacity: 0.13,
  },
  orbBottom: {
    width: 380,
    height: 380,
    bottom: -140,
    right: -130,
    backgroundColor: '#525e75',
    opacity: 0.11,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  backText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.midnightNavy,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
    backgroundColor: Colors.background,
  },
  errorEmoji: { fontSize: 48, marginBottom: Spacing.base },
  errorText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.midnightNavy,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorSub: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
