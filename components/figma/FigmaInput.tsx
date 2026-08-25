import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { FONTS, RADIUS, FIGMA_COLORS } from '@/constants/portal-theme';
import { SRS, GRAY, TEXT } from '@/lib/constants/figma-tokens';

interface FigmaInputProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  containerStyle?: ViewStyle;
}

export function FigmaInput({
  label,
  error,
  leftIcon,
  showPasswordToggle = false,
  containerStyle,
  secureTextEntry,
  ...props
}: FigmaInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const borderColor = error
    ? SRS.red
    : isFocused
    ? SRS.teal
    : FIGMA_COLORS.inputBorder;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, { borderColor }]}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithIcon : undefined]}
          placeholderTextColor={GRAY[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Text style={styles.eyeText}>
              {isPasswordVisible ? '👁' : '👁‍🗨'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontFamily: FONTS.inknutAntiqua,
    color: TEXT.black,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: FIGMA_COLORS.inputBorder,
    borderRadius: RADIUS.input,
    backgroundColor: FIGMA_COLORS.inputBg,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.inter.regular,
    color: TEXT.heading,
    paddingVertical: 12,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  eyeIcon: {
    padding: 8,
  },
  eyeText: {
    fontSize: 18,
  },
  error: {
    fontSize: 12,
    fontFamily: FONTS.inter.regular,
    color: SRS.red,
    marginTop: 4,
  },
});
