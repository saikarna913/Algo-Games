// src/core/navigation/GameScreen.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store';
import { getGameById } from '../../games/registry';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  creamDk:   '#e8ceaa',
  bluePlayer: '#2980b9',   // coastal blue for player 1 (O / Blue)
redPlayer:  '#b84c2e',
redBg:      '#eeddd3',   // very light red tint for background
  blueBg:     '#d6e8f5',   // very light blue tint for background
  neutralBg:  '#e8ceaa',   // default cream
};

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
  const addScore   = useGameStore((s) => s.addScore);
  const setActiveGame = useGameStore((s) => s.setActiveGame);

  // currentPlayer: 0 = Red, 1 = Blue — games can call setCurrentPlayer via a prop
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);

  const game = getGameById(gameId);

  const handleGameEnd = useCallback(
    (winner: string) => {
      setActiveGame(null);
      if (game?.onGameEnd) game.onGameEnd(winner as 'red' | 'blue', addScore);

      Alert.alert(
        winner === 'draw' ? '🤝 Draw!' : `🎉 ${winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!`,
        winner === 'draw'
          ? "It's a tie! Brilliant play from both sides."
          : `Congratulations ${winner}! Great game!`,
        [
          { text: '🔄 Play Again', onPress: () => gameRef.current?.reset() },
          { text: '🏠 Home',       onPress: () => navigation.goBack()       },
        ]
      );
    },
    [game, addScore, navigation, setActiveGame]
  );

  const handleExit = useCallback(() => {
    setActiveGame(null);
    navigation.goBack();
  }, [navigation, setActiveGame]);

  if (!game) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorEmoji}>🕹️</Text>
        <Text style={styles.errorTitle}>Game "{gameId}" not found.</Text>
        <Text style={styles.errorSub}>Register it in src/games/registry.ts</Text>
      </View>
    );
  }

  const GameComponent = game.component as any;
  const gameRef = React.useRef<any>(null);

  // Dynamic background based on active player
  const bgColor = currentPlayer === 0 ? P.redBg : P.blueBg;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: bgColor }]}>
      {GameComponent && (
        <GameComponent
          ref={gameRef}
          mode={mode}
          showHeader={true}
          onGameEnd={handleGameEnd}
          onExit={handleExit}
          onPlayerChange={(p: 0 | 1) => setCurrentPlayer(p)}  // games call this on each move
          accentColor={currentPlayer === 0 ? P.redPlayer : P.bluePlayer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#e8ceaa' },
  errorEmoji: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#2e3a4e', textAlign: 'center', marginBottom: 6 },
  errorSub:   { fontSize: 14, color: '#8292ae', textAlign: 'center' },
});