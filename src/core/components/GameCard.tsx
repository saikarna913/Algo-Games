// src/core/components/GameCard.tsx
// Soft Arcade — palette: #f1ddbf · #525e75 · #78938a · #92ba92

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  Dimensions,
} from 'react-native';
import type { GamePlugin } from '../../games/registry';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  cream:  '#f1ddbf',
  slate:  '#525e75',
  teal:   '#78938a',
  sage:   '#92ba92',
  bg:     '#1e2535',   // deep slate for card BG
  dark:   '#141920',   // deepest surface
  ink:    '#0e1117',   // modal backdrop
};

// Card accent cycles through the four palette hues
const ACCENTS = [
  { glow: P.sage,               label: P.dark },
  { glow: P.teal,               label: P.dark },
  { glow: P.cream,              label: P.dark },
  { glow: '#8897b8' /* light slate */, label: P.dark },
];

function getAccent(game: GamePlugin) {
  const sum = game.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return ACCENTS[sum % ACCENTS.length];
}

// ─── Portal Overlay ───────────────────────────────────────────────────────────
interface PortalProps {
  game: GamePlugin;
  visible: boolean;
  onClose: () => void;
  onNavigate: (game: GamePlugin) => void;
}

function PortalOverlay({ game, visible, onClose, onNavigate }: PortalProps) {
  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const bgAnim     = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(40)).current;
  const titleFade  = useRef(new Animated.Value(0)).current;
  const accent = getAccent(game);

  React.useEffect(() => {
    if (!visible) return;
    scaleAnim.setValue(0);
    fadeAnim.setValue(0);
    bgAnim.setValue(0);
    titleSlide.setValue(40);
    titleFade.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(bgAnim,   { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim,{ toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(titleSlide, { toValue: 0, friction: 8, tension: 100, useNativeDriver: true }),
        Animated.timing(titleFade,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(bgAnim,    { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={handleClose}>
      <Animated.View style={[styles.portalBackdrop, { opacity: bgAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View
        style={[
          styles.portalCard,
          {
            borderColor: accent.glow + '99',
            shadowColor: accent.glow,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Corner brackets */}
        <View style={[styles.corner, styles.cornerTL, { borderColor: accent.glow + '77' }]} />
        <View style={[styles.corner, styles.cornerTR, { borderColor: accent.glow + '77' }]} />
        <View style={[styles.corner, styles.cornerBL, { borderColor: accent.glow + '77' }]} />
        <View style={[styles.corner, styles.cornerBR, { borderColor: accent.glow + '77' }]} />

        {/* Glow ring */}
        <View style={[styles.glowRing, { backgroundColor: accent.glow + '18', borderColor: accent.glow + '44' }]}>
          <Text style={styles.portalIcon}>{game.icon}</Text>
        </View>

        <Animated.View style={{ transform: [{ translateY: titleSlide }], opacity: titleFade, alignItems: 'center' }}>
          <Text style={[styles.portalTitle, { color: accent.glow }]}>
            {game.title.toUpperCase()}
          </Text>
          <Text style={styles.portalDifficulty}>
            {'■'.repeat(game.difficulty ?? 1)}
            {'□'.repeat(Math.max(0, 3 - (game.difficulty ?? 1)))}
            {'  '}DIFFICULTY
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: titleFade, width: '100%', marginTop: 10 }}>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: accent.glow, shadowColor: accent.glow }]}
            onPress={() => { handleClose(); setTimeout(() => onNavigate(game), 220); }}
            activeOpacity={0.82}
          >
            <Text style={[styles.playBtnText, { color: P.dark }]}>► PLAY</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
            <Text style={styles.backText}>← BACK</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── GameCard ──────────────────────────────────────────────────────────────────
interface GameCardProps {
  game: GamePlugin;
  onPress: (game: GamePlugin) => void;
  style?: any;
}

export default function GameCard({ game, onPress, style }: GameCardProps) {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;
  const [portalVisible, setPortalVisible] = useState(false);
  const accent = getAccent(game);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.91, useNativeDriver: true, speed: 80, bounciness: 2 }),
      Animated.timing(glowAnim,  { toValue: 1, duration: 100, useNativeDriver: false }),
      Animated.sequence([
        Animated.timing(iconBounce,  { toValue: -7, duration: 80, useNativeDriver: true }),
        Animated.spring(iconBounce,  { toValue: 0, friction: 4, tension: 200, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
      Animated.timing(glowAnim,  { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  const animatedBorder = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [P.slate + '55', accent.glow],
  });

  return (
    <>
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => game.implemented && setPortalVisible(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!game.implemented}
        >
          <Animated.View
            style={[
              styles.card,
              {
                borderColor: animatedBorder,
                shadowColor: accent.glow,
                shadowOpacity: glowAnim,
              },
              !game.implemented && styles.disabledCard,
            ]}
          >
            {game.difficulty === 3 && (
              <View style={[styles.newBadge, { backgroundColor: accent.glow }]}>
                <Text style={[styles.newText, { color: P.dark }]}>NEW</Text>
              </View>
            )}

            <View style={styles.iconContainer}>
              <Animated.Text style={[styles.icon, { transform: [{ translateY: iconBounce }] }]}>
                {game.icon}
              </Animated.Text>
            </View>

            <View style={[styles.bottomBar, { backgroundColor: accent.glow + '22' }]}>
              <View style={[styles.bottomLine, { backgroundColor: accent.glow }]} />
              <Text style={[styles.title, { color: accent.glow }]} numberOfLines={1}>
                {game.title.toUpperCase()}
              </Text>
            </View>

            {!game.implemented && (
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>COMING{'\n'}SOON</Text>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      <PortalOverlay
        game={game}
        visible={portalVisible}
        onClose={() => setPortalVisible(false)}
        onNavigate={onPress}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: P.bg,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    height: 190,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 10,
  },
  disabledCard: { opacity: 0.38 },
  iconContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 62 },
  bottomBar: { paddingVertical: 13, alignItems: 'center', overflow: 'hidden' },
  bottomLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, opacity: 0.7 },
  title: { fontWeight: '900', fontSize: 12, letterSpacing: 2.5 },
  newBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, zIndex: 2 },
  newText: { fontWeight: '900', fontSize: 9, letterSpacing: 1.5 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(14,17,23,0.78)', justifyContent: 'center', alignItems: 'center' },
  overlayText: { color: P.slate, fontWeight: '900', fontSize: 12, letterSpacing: 3, textAlign: 'center' },

  // Portal
  portalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,12,18,0.93)' },
  portalCard: {
    position: 'absolute',
    top: SCREEN_H * 0.5 - 230,
    left: SCREEN_W * 0.5 - 155,
    width: 310,
    backgroundColor: P.bg,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 36,
    shadowOpacity: 0.55,
    elevation: 28,
  },
  corner: { position: 'absolute', width: 18, height: 18, borderWidth: 1.5 },
  cornerTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0 },
  glowRing: { width: 108, height: 108, borderRadius: 54, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  portalIcon: { fontSize: 58 },
  portalTitle: { fontWeight: '900', fontSize: 20, letterSpacing: 3, textAlign: 'center', marginBottom: 6 },
  portalDifficulty: { color: P.teal, fontSize: 10, letterSpacing: 2.5, textAlign: 'center', marginBottom: 22, fontWeight: '700' },
  playBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowOffset: { width: 0, height: 0 }, shadowRadius: 14, shadowOpacity: 0.5, elevation: 8 },
  playBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 3 },
  backBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 6 },
  backText: { color: P.slate, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
});