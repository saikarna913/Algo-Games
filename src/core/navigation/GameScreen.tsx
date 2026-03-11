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
          { text: '🔄 Play Again', onPress: () => handlePlayAgain() },
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

  // Render header + the selected game component (clean, neutral background)
  const GameComponent = game?.component;
  const gameRef = React.useRef<any>(null);

  const handlePlayAgain = () => {
    if (gameRef.current && typeof gameRef.current.reset === 'function') {
      gameRef.current.reset();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}> 
      {GameComponent ? (
        <View style={{ flex: 1, width: '100%' }}>
          {(() => {
            const Comp: any = GameComponent as any;
            return <Comp ref={gameRef} mode={mode} showHeader={true} onGameEnd={handleGameEnd} onExit={handleExit} />;
          })()}
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
    backgroundColor: Colors.background,
  },

  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    paddingRight: Spacing.md,
  },
  backText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.coastalBlue,
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
