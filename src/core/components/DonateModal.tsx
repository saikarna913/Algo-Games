import React, { useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Linking,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";

// ── Palette — matches GameCard exactly ───────────────────────────────────────
const P = {
  creamLt:  '#faf3e8',   // card surface
  creamDk:  '#e8ceaa',   // parchment field
  cream:    '#f1ddbf',
  slate:    '#525e75',
  slateLt:  '#8292ae',
  teal:     '#78938a',
  tealDk:   '#3d6058',
  sage:     '#92ba92',
  sageDk:   '#4a7a4a',
  amber:    '#c47b3a',
  amberDk:  '#8a4e1a',
  ink:      '#2e3a4e',
  red:      '#b85c52',
};

interface DonateModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DonateModal({ visible, onClose }: DonateModalProps) {
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const bgAnim      = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      fadeAnim.setValue(0);
      bgAnim.setValue(0);
      slideAnim.setValue(30);

      Animated.parallel([
        Animated.timing(bgAnim,   { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim,{ toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(slideAnim,{ toValue: 0, friction: 8, tension: 90, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(bgAnim,    { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleDonate = async () => {
    const upiId = "yourupi@okaxis";
    const url = `upi://pay?pa=${upiId}&pn=AlgoGames&am=10&cu=INR&tn=Support%20AlgoGames`;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
    else alert("No UPI app found");
  };

  const openYouTube = async () => {
    await Linking.openURL("https://www.youtube.com/@DrukenCoder");
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>

      {/* Backdrop */}
      <Animated.View style={[styles.overlay, { opacity: bgAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Card */}
      <View style={styles.centerer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}
        >
          {/* Corner brackets — same as portal overlay in GameCard */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Close button */}
         {/* <Pressable
            onPress={handleClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>*/}

          {/* Icon ring — mirrors GameCard portal glow ring */}
          <View style={styles.iconRing}>
            <Text style={styles.icon}>☕</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>SUPPORT DEV</Text>

          {/* Accent divider line */}
          <View style={styles.divider} />

          {/* Message */}
          <Text style={styles.message}>
            Help us keep building.{"\n"}Donate or subscribe to the channel.
          </Text>

          {/* Donate button — amber accent, matches GameCard play button style */}
          <Pressable
            onPress={handleDonate}
            style={({ pressed }) => [styles.donateBtn, pressed && styles.pressed]}
          >
            <Text style={styles.donateBtnText}>► DONATE ₹10</Text>
          </Pressable>

          {/* YouTube button — teal accent, secondary */}
          <Pressable
            onPress={openYouTube}
            style={({ pressed }) => [styles.ytBtn, pressed && styles.pressed]}
          >
            <Text style={styles.ytBtnText}>▶ SUBSCRIBE ON YOUTUBE</Text>
          </Pressable>

          {/* Back / cancel */}
          <Pressable onPress={handleClose} style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}>
            <Text style={styles.cancelText}>← CANCEL</Text>
          </Pressable>

        </Animated.View>
      </View>

    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46,58,78,0.72)',
  },

  centerer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: P.creamLt,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: P.amber + 'aa',
    padding: 28,
    alignItems: 'center',
    // Warm shadow
    shadowColor: P.amber,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 18,
  },

  // Corner brackets — same as GameCard portal
  corner: {
    position: 'absolute',
    width: 18, height: 18,
    borderWidth: 1.5,
    borderColor: P.amber + '99',
  },
  cornerTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0 },

  // Close button
  /*closeBtn: {
    position: 'absolute',
    top: 14, right: 14,
    width: 30, height: 30,
    borderRadius: 15,
    backgroundColor: P.creamDk,
    borderWidth: 1,
    borderColor: P.slate + '44',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: P.slateLt,
    lineHeight: 14,
  },*/

  // Icon ring — mirrors GameCard glow ring
  iconRing: {
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: P.amber + '18',
    borderWidth: 1,
    borderColor: P.amber + '55',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  icon: { fontSize: 40 },

  title: {
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 3,
    color: P.amberDk,
    textAlign: 'center',
    marginBottom: 10,
  },

  divider: {
    width: 40,
    height: 1.5,
    backgroundColor: P.amber + '66',
    borderRadius: 1,
    marginBottom: 14,
  },

  message: {
    textAlign: 'center',
    color: P.slateLt,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.3,
    marginBottom: 22,
  },

  // Primary — amber, matches GameCard play button
  donateBtn: {
    width: '100%',
    backgroundColor: P.amber,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: P.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  donateBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2.5,
  },

  // Secondary — teal, softer
  ytBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: P.teal + 'cc',
    backgroundColor: P.teal + '18',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 6,
  },
  ytBtnText: {
    color: P.tealDk,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.5,
  },

  // Cancel text link
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 6,
  },
  cancelText: {
    color: P.slateLt,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },

  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },
});