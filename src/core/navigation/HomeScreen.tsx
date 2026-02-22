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
// Background uses the CREAM side of the palette — warm parchment.
// Cards are dark (#1e2535), footer is dark — so the screen has a
// light warm field with dark "tile" cards sitting on top. High contrast,
// very intentional, not just "another dark screen".
const BG_BASE    = '#e8ceaa'; // slightly deeper than #f1ddbf for richness
const BG_STRIPE  = '#dfc49e'; // darker stripe for diagonal texture
const SLATE      = '#525e75';
const TEAL       = '#78938a';
const SAGE       = '#92ba92';
const CREAM      = '#f1ddbf';

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

      {/* ── Diagonal stripe texture ── */}
      {/* 10 diagonal bands rendered as rotated thin Views */}
      <View style={styles.stripeContainer} pointerEvents="none">
        {Array.from({ length: 18 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.stripe,
              { top: i * 56 - 40 },
            ]}
          />
        ))}
      </View>

      {/* ── Corner accent blobs ── */}
      <View style={[styles.blob, styles.blobTL]} pointerEvents="none" />
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
    backgroundColor: BG_BASE,
  },

  // ── Diagonal stripes ──────────────────────────────────────────────────────
  stripeContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    left: -200,
    right: -200,
    height: 26,
    backgroundColor: BG_STRIPE,
    opacity: 0.55,
    transform: [{ rotate: '-8deg' }],
  },

  // ── Soft corner blobs (slate + teal tint) ────────────────────────────────
  blob: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.18,
  },
  blobTL: {
    top: -80,
    left: -80,
    backgroundColor: SLATE,
  },
  blobBR: {
    bottom: 60,
    right: -80,
    backgroundColor: TEAL,
  },

  // ── Content ───────────────────────────────────────────────────────────────
  scrollContent: {
    paddingBottom: 110,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
});