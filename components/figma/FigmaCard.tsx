import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { RADIUS, SHADOWS, FIGMA_COLORS } from '@/constants/portal-theme';
import { BG } from '@/lib/constants/figma-tokens';

interface FigmaCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: number;
  style?: ViewStyle;
}

export function FigmaCard({
  children,
  variant = 'default',
  padding = 16,
  style,
}: FigmaCardProps) {
  return (
    <View style={[styles.base, styles[variant], { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: BG.white,
    borderRadius: RADIUS.card,
  },
  default: {
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: FIGMA_COLORS.cardBorder,
  },
  elevated: {
    ...SHADOWS.modal,
  },
  outlined: {
    borderWidth: 1,
    borderColor: FIGMA_COLORS.cardBorder,
  },
  filled: {
    backgroundColor: FIGMA_COLORS.pageBg,
  },
});
