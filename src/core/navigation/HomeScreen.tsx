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

const BG    = '#e8ceaa';
const SLATE = '#525e75';
const TEAL  = '#78938a';
const SAGE  = '#92ba92';

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

  // Show all games on the home screen (including coming-soon entries)
  const visibleGames = GAME_REGISTRY;

  // Responsive card sizing: shrink on small phones, grow on tablets
  const GRID_PADDING = 32;
  const GAP = 14;
  // Make cards slightly larger on phones so they read better
  const MIN_CARD_WIDTH = width < 420 ? 170 : width > 900 ? 220 : 160;

  const columns = Math.max(1, Math.floor((width - GRID_PADDING) / (MIN_CARD_WIDTH + GAP)));
  const cardWidth = Math.max(MIN_CARD_WIDTH, (width - GRID_PADDING - GAP * (columns - 1)) / columns);

  // Soft scale for background orbs so they look good on larger/smaller screens
  const orbScale = Math.max(0.7, Math.min(width / 420, 1.6));

  return (
    <View style={styles.root}>

      {/* Blurry orbs — large, soft, low opacity */}
      <View style={[styles.orb, styles.orbTopLeft, { width: 420 * orbScale, height: 420 * orbScale, top: -180 * orbScale, left: -160 * orbScale }]}  pointerEvents="none" />
      <View style={[styles.orb, styles.orbTopRight, { width: 340 * orbScale, height: 340 * orbScale, top: -100 * orbScale, right: -120 * orbScale }]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbMid, { width: 300 * orbScale, height: 300 * orbScale, top: '38%', left: -140 * orbScale }]}      pointerEvents="none" />
      <View style={[styles.orb, styles.orbBottom, { width: 380 * orbScale, height: 380 * orbScale, bottom: -140 * orbScale, right: -130 * orbScale }]}   pointerEvents="none" />

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
              style={{ width: cardWidth, margin: GAP / 2 }}
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

  // Large blurred circles simulate soft gaussian blobs.
  // React Native doesn't support CSS blur on Views natively,
  // so we stack multiple large semi-transparent circles at
  // different sizes to fake the feathered edge effect.
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },

  // Slate blob — top left
  orbTopLeft: {
    width: 420,
    height: 420,
    top: -180,
    left: -160,
    backgroundColor: SLATE,
    opacity: 0.14,
  },

  // Sage blob — top right
  orbTopRight: {
    width: 340,
    height: 340,
    top: -100,
    right: -120,
    backgroundColor: SAGE,
    opacity: 0.18,
  },

  // Teal blob — mid left
  orbMid: {
    width: 300,
    height: 300,
    top: '38%',
    left: -140,
    backgroundColor: TEAL,
    opacity: 0.13,
  },

  // Slate blob — bottom right
  orbBottom: {
    width: 380,
    height: 380,
    bottom: -140,
    right: -130,
    backgroundColor: SLATE,
    opacity: 0.11,
  },

  scrollContent: {
    paddingBottom: 110,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    justifyContent: 'center',
  },
});