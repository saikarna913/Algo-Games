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

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function HomeScreen({ navigation }: Props) {
  const mode = useGameStore((s) => s.mode);
  const { width } = useWindowDimensions();

  // ---------------- NAVIGATION ----------------
  const handleGamePress = useCallback(
    (game: GamePlugin) => {
      if (!game.implemented) return;
      navigation.navigate("Game", {
        gameId: game.id,
        mode,
      });
    },
    [navigation, mode]
  );

  const visibleGames = GAME_REGISTRY.filter((g) => g.implemented);

  // ---------------- RESPONSIVE GRID ----------------
  const MIN_CARD_WIDTH = 160; // change if you want bigger/smaller cards
  const GRID_PADDING = 32; // 16 + 16 horizontal padding
  const GAP = 16;

  // calculate how many columns fit
  const columns = Math.max(
    2,
    Math.floor((width - GRID_PADDING) / (MIN_CARD_WIDTH + GAP))
  );

  // calculate actual card width
  const cardWidth =
    (width - GRID_PADDING - GAP * (columns - 1)) / columns;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <Header onDonatePress={() => console.log("Donate pressed")} />

        {/* GAME GRID */}
        <View style={styles.grid}>
          {visibleGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onPress={handleGamePress}
              style={[
                styles.cardStyle,
                { width: cardWidth, marginRight: GAP },
              ]}
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
    backgroundColor: "#F4F6F9",
  },

  scrollContent: {
    paddingBottom: 60,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
  },

  cardStyle: {
    marginBottom: 20,
    borderRadius: 18,
  },
});