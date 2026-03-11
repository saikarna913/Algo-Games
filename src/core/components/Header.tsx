// src/core/navigation/Header.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  TouchableOpacity,
  Linking,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LogoPng from "../../../assets/ui/LogoPng";
import DonatePng from "../../../assets/ui/DonatePng";
import MutePng from "../../../assets/ui/MutePng";
import DonateModal from "../components/DonateModal";

// ── Palette (mirrors GameCard / GameHeader) ───────────────────────────────────
const P = {
  cream:    '#f1ddbf',
  creamDk:  '#e8ceaa',
  creamLt:  '#faf3e8',
  ink:      '#2e3a4e',
  slate:    '#525e75',
  slateLt:  '#8292ae',
  teal:     '#78938a',
  sage:     '#92ba92',
  amber:    '#c47b3a',
  amberDk:  '#8a4e1a',
};

export default function Header() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [showDonate, setShowDonate] = useState(false);

  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), max);

  const donateWidth  = clamp(width * 0.18, 60, 140);
  const donateHeight = clamp(width * 0.08, 30, 70);

  const openYouTube = async () => {
    const url = "https://www.youtube.com/@DrukenCoder";
    if (await Linking.canOpenURL(url)) Linking.openURL(url);
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>

        {/* Decorative top rule */}
        <View style={styles.topRule} />

        {/* Main row */}
        <View style={styles.row}>

          {/* LEFT — Logo (tappable → YouTube) */}
          <Pressable onPress={openYouTube} style={styles.logoWrapper}>
            <View style={[styles.iconFrame, { borderColor: P.teal + '88' }]}>
              <LogoPng />
            </View>
          </Pressable>

          {/* CENTER — Wordmark / title pill */}
          <View style={styles.titlePill}>
            <Text style={styles.titleText}>Drunken</Text>
            <View style={[styles.titleDot, { backgroundColor: P.amber }]} />
            <Text style={styles.titleText}>Coder</Text>
          </View>

          {/* RIGHT — Donate + Mute */}
          <View style={styles.right}>
            {/* Donate wrapped in arcade-style bordered frame */}
            <View style={[styles.iconFrame, { borderColor: P.amber + '88' }]}>
              <DonatePng
                width={donateWidth * 0.7}
                height={donateHeight * 0.7}
                onPress={() => setShowDonate(true)}
              />
            </View>

            <View style={[styles.iconFrame, { borderColor: P.slateLt + '66' }]}>
              <MutePng />
            </View>
          </View>
        </View>

        {/* Decorative bottom rule with centre gem */}
        <View style={styles.bottomRuleRow}>
          <View style={[styles.rule, { backgroundColor: P.teal + '44' }]} />
          <View style={[styles.gem, { backgroundColor: P.amber, shadowColor: P.amber }]} />
          <View style={[styles.rule, { backgroundColor: P.teal + '44' }]} />
        </View>

      </View>

      <DonateModal visible={showDonate} onClose={() => setShowDonate(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },

  topRule: {
    height: 1,
    backgroundColor: '#78938a33',
    marginBottom: 12,
    marginHorizontal: 4,
    borderRadius: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Logo
  logoWrapper: {},
  iconFrame: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 6,
    backgroundColor: '#faf3e8cc',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Centre wordmark
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#faf3e8',
    borderWidth: 1.5,
    borderColor: '#78938a55',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#78938a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  titleText: {
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 3,
    color: '#2e3a4e',
  },
  titleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Right cluster
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Bottom rule
  bottomRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  rule: {
    flex: 1,
    height: 1.5,
    borderRadius: 1,
  },
  gem: {
    width: 7,
    height: 7,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
});