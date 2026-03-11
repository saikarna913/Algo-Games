// src/core/components/GameCard.tsx
// Warm Arcade — light cream cards on parchment background

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
  useWindowDimensions,
} from 'react-native';
import type { GamePlugin } from '../../games/registry';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  cream:   '#f1ddbf',   // background base
  creamDk: '#e8ceaa',   // slightly deeper cream for card bg
  creamLt: '#faf3e8',   // lightest surface (icon area)
  slate:   '#525e75',   // dark text / borders
  slateLt: '#8292ae',   // muted slate for labels
  teal:    '#78938a',
  sage:    '#92ba92',
  ink:     '#2e3a4e',   // deepest text
};

// Accent per card — darker rich versions of the palette for contrast on cream
const ACCENTS = [
  { accent: P.sage,   dark: '#4a7a4a' },  // deep sage
  { accent: P.teal,   dark: '#3d6058' },  // deep teal
  { accent: P.slate,  dark: P.ink      },  // slate/navy
  { accent: '#c47b3a', dark: '#8a4e1a' }, // warm amber — derived from cream's shadow
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
  const a = getAccent(game);

  const { width: winW, height: winH } = useWindowDimensions();
  const PORTAL_W = 310;
  const PORTAL_H_HALF = 230; // half of the visual portal height used previously

  React.useEffect(() => {
    if (!visible) return;
    scaleAnim.setValue(0); fadeAnim.setValue(0); bgAnim.setValue(0);
    titleSlide.setValue(40); titleFade.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(bgAnim,    { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
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
      {/* Backdrop — warm tinted scrim */}
      <Animated.View style={[styles.portalBackdrop, { opacity: bgAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View
        style={[
          styles.portalCard,
          {
            borderColor: a.accent + 'cc',
            shadowColor: a.accent,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            top: winH / 2 - PORTAL_H_HALF,
            left: winW / 2 - PORTAL_W / 2,
          },
        ]}
      >
        {/* Corner brackets */}
        {['TL','TR','BL','BR'].map((pos) => (
          <View key={pos} style={[
            styles.corner,
            pos === 'TL' && styles.cornerTL,
            pos === 'TR' && styles.cornerTR,
            pos === 'BL' && styles.cornerBL,
            pos === 'BR' && styles.cornerBR,
            { borderColor: a.accent + 'aa' },
          ]} />
        ))}

        {/* Glow ring */}
        <View style={[styles.glowRing, { backgroundColor: a.accent + '18', borderColor: a.accent + '66' }]}>
          <Text style={styles.portalIcon}>{game.icon}</Text>
        </View>

        <Animated.View style={{ transform: [{ translateY: titleSlide }], opacity: titleFade, alignItems: 'center' }}>
          <Text style={[styles.portalTitle, { color: a.dark }]}> 
            {game.title.toUpperCase()}
          </Text>
          <Text style={[styles.portalDifficulty, { color: a.accent }]}> 
            {'■'.repeat(game.difficulty ?? 1)}{'□'.repeat(Math.max(0, 3 - (game.difficulty ?? 1)))}
            {'  '}DIFFICULTY
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: titleFade, width: '100%', marginTop: 10 }}>
          {game.implemented ? (
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: a.accent, shadowColor: a.accent }]}
              onPress={() => { handleClose(); setTimeout(() => onNavigate(game), 220); }}
              activeOpacity={0.82}
            >
              <Text style={styles.playBtnText}>► PLAY</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.playBtnDisabled, { backgroundColor: '#f0f0f0' }]}> 
              <Text style={[styles.playBtnText, { color: '#777' }]}>COMING SOON</Text>
            </View>
          )}

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
  const borderAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;
  const [portalVisible, setPortalVisible] = useState(false);
  const a = getAccent(game);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim,  { toValue: 0.92, useNativeDriver: true, speed: 80, bounciness: 2 }),
      Animated.timing(borderAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
      Animated.timing(shadowAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
      Animated.sequence([
        Animated.timing(iconBounce, { toValue: -8, duration: 80, useNativeDriver: true }),
        Animated.spring(iconBounce, { toValue: 0, friction: 4, tension: 200, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim,  { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
      Animated.timing(borderAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.timing(shadowAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  const animatedBorder = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [P.slateLt + '66', a.accent],
  });

  return (
    <>
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setPortalVisible(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View
            style={[
              styles.card,
              {
                borderColor: animatedBorder,
                shadowColor: a.accent,
                shadowOpacity: shadowAnim,
              },
              !game.implemented && styles.disabledCard,
            ]}
          >
            {/* NEW badge */}
            {game.difficulty === 3 && (
              <View style={[styles.newBadge, { backgroundColor: a.accent }]}>
                <Text style={styles.newText}>NEW</Text>
              </View>
            )}

            {/* Icon area — lightest cream */}
            <View style={styles.iconContainer}>
              <Animated.Text style={[styles.icon, { transform: [{ translateY: iconBounce }] }]}>
                {game.icon}
              </Animated.Text>
            </View>

            {/* Bottom bar — accent tint on cream */}
            <View style={[styles.bottomBar, { backgroundColor: a.accent + '28', borderTopColor: a.accent + '55' }]}>
              <Text style={[styles.title, { color: a.dark }]} numberOfLines={1}>
                {game.title.toUpperCase()}
              </Text>
            </View>

            {/* Coming soon */}
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
    backgroundColor: P.creamLt,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    height: 190,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  disabledCard: { opacity: 0.4 },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.creamLt,
  },
  icon: { fontSize: 62 },
  bottomBar: {
    paddingVertical: 13,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  title: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2.5,
  },
  newBadge: {
    position: 'absolute',
    top: 10, right: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, zIndex: 2,
  },
  newText: { color: '#fff', fontWeight: '900', fontSize: 9, letterSpacing: 1.5 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(241,221,191,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: P.slateLt,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 3,
    textAlign: 'center',
  },

  // ── Portal ──────────────────────────────────────────────────────────────────
  portalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46,58,78,0.75)',
  },
  portalCard: {
    position: 'absolute',
    top: SCREEN_H * 0.5 - 230,
    left: SCREEN_W * 0.5 - 155,
    width: 310,
    backgroundColor: P.creamLt,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 32,
    shadowOpacity: 0.35,
    elevation: 24,
  },
  corner: { position: 'absolute', width: 18, height: 18, borderWidth: 1.5 },
  cornerTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0 },
  glowRing: {
    width: 108, height: 108, borderRadius: 54,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  portalIcon: { fontSize: 58 },
  portalTitle: {
    fontWeight: '900', fontSize: 20,
    letterSpacing: 3, textAlign: 'center', marginBottom: 6,
  },
  portalDifficulty: {
    fontSize: 10, letterSpacing: 2.5,
    textAlign: 'center', marginBottom: 22, fontWeight: '700',
  },
  playBtn: {
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10, shadowOpacity: 0.4, elevation: 6,
  },
  playBtnDisabled: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 3 },
  backBtn: { marginTop: 14, alignItems: 'center', paddingVertical: 6 },
  backText: { color: P.slateLt, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
});