// src/core/components/GlobalFooter.tsx
// Soft Arcade footer — palette: #f1ddbf · #525e75 · #78938a · #92ba92

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore, selectCombinedScore, selectMultiplayerTotal } from '../store';

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  cream:  '#f1ddbf',
  slate:  '#525e75',
  teal:   '#78938a',
  sage:   '#92ba92',
  bg:     '#161d2b',
  dark:   '#0e1117',
  border: '#252f42',
};

// ── Animated score that pops on change ───────────────────────────────────────
function AnimatedScore({ value, color }: { value: number; color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const prev  = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 80, bounciness: 6 }),
        Animated.spring(scale, { toValue: 1,   useNativeDriver: true, speed: 30, bounciness: 10 }),
      ]).start();
    }
  }, [value]);

  return (
    <Animated.Text style={[styles.scoreDigit, { color, transform: [{ scale }] }]}>
      {value}
    </Animated.Text>
  );
}

// ── Breathing dot ─────────────────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.7, duration: 950, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 950, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.dotRing, { borderColor: color, transform: [{ scale: pulse }], opacity: 0.3 }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface GlobalFooterProps {
  onDonatePress: () => void;
}

export default function GlobalFooter({ onDonatePress }: GlobalFooterProps) {
  const insets   = useSafeAreaInsets();
  const playerRed  = useGameStore((s) => s.playerRed);
  const playerBlue = useGameStore((s) => s.playerBlue);
  const mode       = useGameStore((s) => s.mode);
  const multiplayerPlayers = useGameStore((s) => s.multiplayerPlayers);
  const combined   = useGameStore(selectCombinedScore);
  const multiTotal = useGameStore(selectMultiplayerTotal);
  const isMultiplayer = mode === 'multiplayer';

  const slideAnim = useRef(new Animated.Value(80)).current;
  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + 8, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Top rule */}
      <View style={styles.topRule} />

      {isMultiplayer ? (
        // ── Multiplayer ──────────────────────────────────────────────────────
        <View style={styles.row}>
          <View style={styles.chipsRow}>
            {multiplayerPlayers.slice(0, 4).map((player) => (
              <View key={player.id} style={[styles.chip, { borderColor: player.color + '88' }]}>
                <View style={[styles.chipDot, { backgroundColor: player.color }]} />
                <Text style={[styles.chipName, { color: player.color }]} numberOfLines={1}>
                  {player.name}
                </Text>
                <AnimatedScore value={player.score} color={player.color} />
              </View>
            ))}
            {multiplayerPlayers.length === 0 && (
              <Text style={styles.emptyText}>NO PLAYERS</Text>
            )}
          </View>
          <View style={styles.totalBlock}>
            <Text style={styles.microLabel}>TOTAL</Text>
            <AnimatedScore value={multiTotal} color={P.cream} />
          </View>
        </View>
      ) : (
        // ── Two-player ───────────────────────────────────────────────────────
        <View style={styles.row}>

          {/* Red side */}
          <View style={styles.playerSide}>
            <PulseDot color={P.sage} />
            <View style={styles.playerTexts}>
              <Text style={[styles.microLabel, { color: P.sage }]}>RED</Text>
              <AnimatedScore value={playerRed.score} color={P.sage} />
            </View>
          </View>

          {/* Center */}
          <View style={styles.centerBlock}>
            <View style={[styles.vDivider, { backgroundColor: P.sage + '55' }]} />
            <View style={styles.centerInner}>
              <Text style={styles.microLabel}>COMBINED</Text>
              <AnimatedScore value={combined} color={P.cream} />
              <TouchableOpacity
                onPress={onDonatePress}
                style={styles.donateBtn}
                activeOpacity={0.78}
              >
                <Text style={styles.donateBtnText}>☕ DONATE ₹10</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.vDivider, { backgroundColor: P.teal + '55' }]} />
          </View>

          {/* Blue side */}
          <View style={[styles.playerSide, styles.playerSideRight]}>
            <View style={[styles.playerTexts, { alignItems: 'flex-end' }]}>
              <Text style={[styles.microLabel, { color: P.teal }]}>BLUE</Text>
              <AnimatedScore value={playerBlue.score} color={P.teal} />
            </View>
            <PulseDot color={P.teal} />
          </View>

        </View>
      )}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: P.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderTopColor: P.border,
    paddingTop: 10,
    paddingHorizontal: 18,
    shadowColor: P.teal,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 18,
    zIndex: 100,
  },
  topRule: {
    height: 1,
    marginHorizontal: 40,
    marginBottom: 10,
    backgroundColor: P.slate + '55',
    borderRadius: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Score digit
  scoreDigit: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  microLabel: {
    fontSize: 8,
    color: P.slate,
    letterSpacing: 2.5,
    fontWeight: '800',
    marginBottom: 1,
  },

  // Two-player sides
  playerSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  playerSideRight: { justifyContent: 'flex-end' },
  playerTexts: { alignItems: 'flex-start' },

  // Center
  centerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 2,
  },
  vDivider: { width: 1, height: 38, borderRadius: 1, opacity: 0.7 },
  centerInner: { alignItems: 'center', gap: 1 },
  donateBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: P.cream + '66',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  donateBtnText: {
    fontSize: 9,
    color: P.cream,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Pulse dot
  dotWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  dot:     { position: 'absolute', width: 7, height: 7, borderRadius: 4 },
  dotRing: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },

  // Multiplayer chips
  chipsRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: P.dark,
  },
  chipDot:  { width: 6, height: 6, borderRadius: 3 },
  chipName: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, maxWidth: 48 },
  emptyText: { color: P.slate, fontSize: 10, letterSpacing: 3, fontWeight: '800' },
  totalBlock: {
    alignItems: 'center',
    marginLeft: 10,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: P.border,
  },
});