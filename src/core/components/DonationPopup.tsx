// src/core/components/DonationPopup.tsx
// One-time donation popup shown only on first app launch.
// After user donates or dismisses, stores state in AsyncStorage via Zustand.

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../theme';

interface DonationPopupProps {
  visible: boolean;
  onDonate: () => void;
  onDismiss: () => void;
}

export default function DonationPopup({ visible, onDonate, onDismiss }: DonationPopupProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.popup, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Emoji decoration */}
          <Text style={styles.emoji}>☕</Text>

          <Text style={styles.heading}>Enjoying the app?</Text>
          <Text style={styles.subtext}>
            This app is free and made with ❤️ by a CS student.{'\n'}
            A small ₹10 donation helps keep it alive and add more games!
          </Text>

          {/* Benefits */}
          <View style={styles.benefitsList}>
            {['🎮 More games coming soon', '🐛 Bug fixes & updates', '☕ Dev gets coffee'].map((b) => (
              <Text key={b} style={styles.benefitItem}>{b}</Text>
            ))}
          </View>

          {/* Buttons */}
          <TouchableOpacity style={styles.donateBtn} onPress={onDonate} activeOpacity={0.85}>
            <Text style={styles.donateBtnText}>💛 Donate ₹10</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={onDismiss}>
            <Text style={styles.skipBtnText}>Maybe later</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Mock donation — no real payment processed in this version.
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  popup: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...Shadow.lg,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  heading: {
    fontSize: FontSize['2xl'],
    fontWeight: '800',
    color: Colors.midnightNavy,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtext: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.base,
  },
  benefitsList: {
    alignSelf: 'stretch',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  benefitItem: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  donateBtn: {
    backgroundColor: Colors.deepTeal,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing['3xl'],
    paddingVertical: Spacing.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  donateBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  skipBtn: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  skipBtnText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  disclaimer: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
