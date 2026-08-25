import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BG, SLATE, TEXT } from '@/lib/constants/figma-tokens';

interface AdminCardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  headerRight?: React.ReactNode;
}

export function AdminCard({ title, children, style, headerRight }: AdminCardProps) {
  return (
    <View style={[styles.card, style]}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {headerRight}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: BG.white,
    borderWidth: 1,
    borderColor: SLATE[100],
    shadowColor: TEXT.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { fontSize: 15, fontWeight: '700', color: SLATE[900] },
});
