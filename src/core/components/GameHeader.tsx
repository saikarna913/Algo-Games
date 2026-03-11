// src/core/components/GameHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// ── Palette (mirrors GameCard) ────────────────────────────────────────────────
const P = {
  cream:   '#f1ddbf',
  creamDk: '#e8ceaa',
  creamLt: '#faf3e8',
  slate:   '#525e75',
  slateLt: '#8292ae',
  ink:     '#2e3a4e',
  teal:    '#78938a',
  sage:    '#92ba92',
};

interface Props {
  title: string;
  onBack?: () => void;
  onInfo?: () => void;
  accentColor?: string; // optional — pass player colour for dynamic tinting
}

export default function GameHeader({ title, onBack, onInfo, accentColor }: Props) {
  const accent = accentColor ?? P.teal;

  return (
    <View style={[styles.header, { borderBottomColor: accent + '55' }]}>
      {/* Back button */}
      <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { borderColor: accent + '88' }]}>
        <Text style={[styles.iconBtnText, { color: accent }]}>←</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>
        {title.toUpperCase()}
      </Text>

      {/* Info button */}
      <TouchableOpacity onPress={onInfo} style={[styles.iconBtn, { borderColor: accent + '88' }]}>
        <Text style={[styles.iconBtnText, { color: accent }]}>i</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    backgroundColor: 'transparent',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  iconBtnText: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 20,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#2e3a4e',
  },
});