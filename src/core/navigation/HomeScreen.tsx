import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useGameStore } from "../store";
import GameCard from "../components/GameCard";
import Header from "../components/Header";
import { GAME_REGISTRY, GamePlugin } from "../../games/registry";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// ── Palette ───────────────────────────────────────────────────────────────────
// Everything lives in the warm cream world.
// Background = mid-depth cream, cards = lightest cream (#faf3e8)
// so cards feel like they lift off the surface with a natural shadow.
const BG       = '#e8ceaa'; // parchment field
const BG_DEEP  = '#dfc49e'; // stripe / shadow tint
const SLATE    = '#525e75';
const TEAL     = '#78938a';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function HomeScreen({ navigation }: Props) {
  const mode = useGameStore((s) => s.mode);
  const { width } = useWindowDimensions();

  const handleGamePress = useCallback(
    (game: GamePlugin) => {
      if (!game.implemented) return;
      navigation.navigate("Game", { gameId: game.id, mode });
    },
    [navigation, mode]
  );

  const visibleGames = GAME_REGISTRY.filter((g) => g.implemented);

  // ── Responsive grid ───────────────────────────────────────────────────────
  const MIN_CARD_WIDTH = 160;
  const GRID_PADDING   = 32;
  const GAP            = 14;

  const columns   = Math.max(2, Math.floor((width - GRID_PADDING) / (MIN_CARD_WIDTH + GAP)));
  const cardWidth = (width - GRID_PADDING - GAP * (columns - 1)) / columns;

  return (
    <View style={styles.root}>

      {/* Diagonal stripe texture — same cream family, just a touch darker */}
      <View style={styles.stripeContainer} pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={[styles.stripe, { top: i * 52 - 40 }]} />
        ))}
      </View>

      {/* Soft slate blob — top-left */}
      <View style={[styles.blob, styles.blobTL]} pointerEvents="none" />
      {/* Soft teal blob — bottom-right */}
      <View style={[styles.blob, styles.blobBR]} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <View style={[styles.grid, { paddingHorizontal: GRID_PADDING / 2 }]}>
          {visibleGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onPress={handleGamePress}
              style={{ width: cardWidth, marginRight: GAP, marginBottom: GAP }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  stripeContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    left: -300,
    right: -300,
    height: 24,
    backgroundColor: BG_DEEP,
    opacity: 0.45,
    transform: [{ rotate: '-7deg' }],
  },

  blob: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.13,
  },
  blobTL: {
    top: -100,
    left: -100,
    backgroundColor: SLATE,
  },
  blobBR: {
    bottom: 80,
    right: -100,
    backgroundColor: TEAL,
  },

  scrollContent: {
    paddingBottom: 110,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
});