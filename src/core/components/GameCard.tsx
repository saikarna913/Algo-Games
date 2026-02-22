// src/core/components/GameCard.tsx
// Arcade-style big tile card

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import type { GamePlugin } from '../../games/registry';

interface GameCardProps {
  game: GamePlugin;
  onPress: (game: GamePlugin) => void;
  style?: any;
}

export default function GameCard({ game, onPress, style }: GameCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 60,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress(game)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!game.implemented}
        style={[
          styles.card,
          !game.implemented && styles.disabledCard,
        ]}
      >
        {/* Optional NEW badge */}
        {game.difficulty === 3 && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>NEW!</Text>
          </View>
        )}

        {/* Big Icon Center */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{game.icon}</Text>
        </View>

        {/* Bottom Title Bar */}
        <View style={styles.bottomBar}>
          <Text style={styles.title} numberOfLines={1}>
            {game.title.toUpperCase()}
          </Text>
        </View>

        {!game.implemented && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>COMING SOON</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 4,
    borderColor: '#222',
    overflow: 'hidden',
    height: 190,
    justifyContent: 'space-between',
  },

  disabledCard: {
    opacity: 0.6,
  },

  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 60,
  },

  bottomBar: {
    backgroundColor: '#222',
    paddingVertical: 14,
    alignItems: 'center',
  },

  title: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },

  newBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#00C853',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 2,
  },

  newText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlayText: {
    fontWeight: '900',
    fontSize: 14,
  },
});