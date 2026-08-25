import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PURPLE, SLATE } from '@/lib/constants/figma-tokens';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  accentColor?: string;
}

export function SectionHeader({ title, actionLabel, onAction, accentColor = PURPLE[700] }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={[styles.actionBtn, { backgroundColor: accentColor + '08' }]} activeOpacity={0.7}>
          <IconSymbol name="add" size={14} color={accentColor} />
          <Text style={[styles.actionText, { color: accentColor }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '700', color: SLATE[900] },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionText: { fontSize: 13, fontWeight: '700' },
});
