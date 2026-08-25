import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PURPLE, SLATE } from '@/lib/constants/figma-tokens';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  accentColor?: string;
}

export function EmptyState({ icon, title, message, accentColor = PURPLE[700] }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '10' }]}>
        <IconSymbol name={icon as any} size={32} color={accentColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', color: SLATE[900], marginBottom: 6, textAlign: 'center' },
  message: { fontSize: 14, color: SLATE[500], textAlign: 'center', lineHeight: 20 },
});
