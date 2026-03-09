// src/core/components/GlobalFooter.tsx
// Frosted glass footer — BlurView over the parchment background

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useGameStore, selectCombinedScore, selectMultiplayerTotal } from '../store';

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  cream:    '#f1ddbf',
  slate:    '#525e75',
  teal:     '#78938a',
  sage:     '#92ba92',
  ink:      '#2e3a4e',
  muted:    '#8292ae',
  border:   'rgba(201,169,126,0.35)',  // warm brown at low opacity
  red:      '#b85c52',   // terracotta
  blue:     '#4a7a9b',   // dusty blue
};

// ── Animated score ────────────────────────────────────────────────────────────
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
      <Animated.View style={[styles.dotRing, { borderColor: color, transform: [{ scale: pulse }], opacity: 0.4 }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface GlobalFooterProps {
  onDonatePress: () => void;
}

export default function GlobalFooter({ onDonatePress }: GlobalFooterProps) {
  const insets             = useSafeAreaInsets();
  const playerRed          = useGameStore((s) => s.playerRed);
  const playerBlue         = useGameStore((s) => s.playerBlue);
  const mode               = useGameStore((s) => s.mode);
  const multiplayerPlayers = useGameStore((s) => s.multiplayerPlayers);
  const combined           = useGameStore(selectCombinedScore);
  const multiTotal         = useGameStore(selectMultiplayerTotal);
  const isMultiplayer      = mode === 'multiplayer';

  const slideAnim = useRef(new Animated.Value(80)).current;
  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }).start();
  }, []);

  const content = (
    <>
      {/* Handle */}
      <View style={styles.handle} />

      {isMultiplayer ? (
        <View style={styles.row}>
          <View style={styles.chipsRow}>
            {multiplayerPlayers.slice(0, 4).map((player) => (
              <View key={player.id} style={[styles.chip, { borderColor: player.color + '66' }]}>
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
            <AnimatedScore value={multiTotal} color={P.ink} />
          </View>
        </View>
      ) : (
        <View style={styles.row}>

          {/* Blue (left) */}
          <View style={[styles.playerSide, styles.playerSideLeft]}>
            <View style={[styles.playerPill, { backgroundColor: P.blue + '18', borderColor: P.blue + '55' }]}>
              <PulseDot color={P.blue} />
              <View style={styles.playerTexts}>
                <Text style={[styles.microLabel, { color: P.blue }]}>BLUE</Text>
                <AnimatedScore value={playerBlue.score} color={P.blue} />
              </View>
            </View>
          </View>

          {/* Center */}
          <View style={styles.centerBlock}>
            <View style={[styles.vDivider, { backgroundColor: P.blue + '40' }]} />
            <View style={styles.centerInner}>
              <Text style={styles.microLabel}>COMBINED</Text>
              <AnimatedScore value={combined} color={P.ink} />
              <TouchableOpacity onPress={onDonatePress} style={styles.donateBtn} activeOpacity={0.78}>
                <Text style={styles.donateBtnText}>☕ DONATE ₹10</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.vDivider, { backgroundColor: P.red + '40' }]} />
          </View>

          {/* Red (right) */}
          <View style={[styles.playerSide, styles.playerSideRight]}>
            <View style={[styles.playerPill, { backgroundColor: P.red + '18', borderColor: P.red + '55' }]}>
              <View style={[styles.playerTexts, { alignItems: 'flex-end' }]}>
                <Text style={[styles.microLabel, { color: P.red }]}>RED</Text>
                <AnimatedScore value={playerRed.score} color={P.red} />
              </View>
              <PulseDot color={P.red} />
            </View>
          </View>

        </View>
      )}
    </>
  );

  return (
    <Animated.View
      style={[styles.wrapper, { paddingBottom: insets.bottom + 8, transform: [{ translateY: slideAnim }] }]}
    >
      {/* Glass layer */}
      <BlurView
        intensity={55}
        tint="light"
        style={StyleSheet.absoluteFill}
      />

      {/* Warm cream tint over the blur */}
      <View style={styles.tintLayer} pointerEvents="none" />

      {/* Top border line */}
      <View style={styles.topBorder} pointerEvents="none" />

      {/* Content sits above blur layers */}
      <View style={styles.contentWrapper}>
        {content}
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',         // clips BlurView to rounded corners
    paddingTop: 8,
    zIndex: 100,
    // Subtle warm shadow
    shadowColor: '#a07840',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },

  // Warm cream wash at ~45% over the blur so it picks up the parchment palette
  tintLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(241,221,191,0.45)',
  },

  // Hairline warm-brown top edge
  topBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(201,169,126,0.6)',
  },

  contentWrapper: {
    paddingHorizontal: 18,
  },

  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(82,94,117,0.3)',
    alignSelf: 'center',
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scoreDigit: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  microLabel: {
    fontSize: 8,
    color: P.muted,
    letterSpacing: 2.5,
    fontWeight: '800',
    marginBottom: 1,
  },

  playerSide: {
    width: 120,
  },
  playerSideRight: {
    alignItems: 'center',
  },  
  playerSideLeft: {
    alignItems: 'center',
  },
  playerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'center',
  },
  playerTexts: {
    alignItems: 'flex-start',
  },

  centerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 2,
  },
  vDivider: { width: 1, height: 38, borderRadius: 1 },
  centerInner: { alignItems: 'center', gap: 1 },

  donateBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(201,169,126,0.7)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(241,221,191,0.5)',
  },
  donateBtnText: {
    fontSize: 9,
    color: P.ink,
    fontWeight: '900',
    letterSpacing: 1,
  },

  dotWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  dot:     { position: 'absolute', width: 7, height: 7, borderRadius: 4 },
  dotRing: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },

  chipsRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(241,221,191,0.4)',
  },
  chipDot:  { width: 6, height: 6, borderRadius: 3 },
  chipName: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, maxWidth: 48, color: P.ink },
  emptyText: { color: P.muted, fontSize: 10, letterSpacing: 3, fontWeight: '800' },
  totalBlock: {
    alignItems: 'center',
    marginLeft: 10,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(201,169,126,0.4)',
  },
});