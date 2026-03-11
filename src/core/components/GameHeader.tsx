import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadow } from '../theme';

interface Props {
  title: string;
  onBack?: () => void;
  onInfo?: () => void;
}

export default function GameHeader({ title, onBack, onInfo }: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity onPress={onInfo} style={styles.infoBtn}>
        <Text style={styles.infoText}>i</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: { paddingRight: Spacing.md },
  backBtnText: { fontSize: FontSize.md, color: Colors.coastalBlue, fontWeight: '600' },
  title: { flex: 1, textAlign: 'center', fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.midnightNavy },
  infoBtn: { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  infoText: { fontSize: 18, fontWeight: '700', color: Colors.midnightNavy },
});
