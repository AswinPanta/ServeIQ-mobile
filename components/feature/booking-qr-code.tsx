import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SLATE } from '@/lib/constants/figma-tokens';

interface BookingQrCodeProps {
  /** Data to encode — the booking confirmation/ref number. */
  value: string;
  /** Box size in px (default 180). */
  size?: number;
  hint?: string;
}

/**
 * Real, scannable booking QR code using react-native-qrcode-svg (works offline).
 */
export function BookingQrCode({ value, size = 180, hint }: BookingQrCodeProps) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.box, { width: size + 24, height: size + 24 }]}>
        <QRCode
          value={value}
          size={size}
          color={SLATE[900]}
          backgroundColor="white"
          logoSize={size * 0.15}
        />
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  box: {
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: SLATE[100],
    padding: 12,
  },
  hint: { fontSize: 12, color: SLATE[400], marginTop: 10, textAlign: 'center' },
});
