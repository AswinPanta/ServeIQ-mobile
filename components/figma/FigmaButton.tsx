import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { FONTS, RADIUS } from '@/constants/portal-theme';
import { BG, BRAND, SRS, SLATE } from '@/lib/constants/figma-tokens';

interface FigmaButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function FigmaButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: FigmaButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? BG.white : BRAND.navyLight}
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: {
    backgroundColor: BRAND.navyLight,
    borderRadius: RADIUS.button,
  },
  secondary: {
    backgroundColor: SRS.teal,
    borderRadius: RADIUS.button,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: SLATE[200],
    borderRadius: RADIUS.button,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: RADIUS.button,
  },
  size_small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  size_medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  size_large: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    minHeight: 52,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: BG.white,
    fontFamily: FONTS.inter.semiBold,
    fontSize: 14,
  },
  text_secondary: {
    color: BG.white,
    fontFamily: FONTS.inter.semiBold,
    fontSize: 14,
  },
  text_outline: {
    color: BRAND.navyLight,
    fontFamily: FONTS.inter.semiBold,
    fontSize: 14,
  },
  text_ghost: {
    color: SRS.teal,
    fontFamily: FONTS.inter.semiBold,
    fontSize: 14,
  },
  textSize_small: {
    fontSize: 12,
  },
  textSize_medium: {
    fontSize: 14,
  },
  textSize_large: {
    fontSize: 16,
  },
  textDisabled: {
    opacity: 0.5,
  },
});
