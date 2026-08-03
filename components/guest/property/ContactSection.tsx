import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS } from '@/constants/portal-theme';

const ACCENT = '#2E86AB';

interface ContactSectionProps {
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
}

export function ContactSection({ phone, email, checkInTime, checkOutTime }: ContactSectionProps) {
  return (
    <View>
      <Text style={s.title}>Contact</Text>
      <TouchableOpacity style={s.row} onPress={() => Linking.openURL(`tel:${phone}`)}>
        <IconSymbol name="phone" size={16} color={ACCENT} />
        <Text style={s.text}>{phone}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.row} onPress={() => Linking.openURL(`mailto:${email}`)}>
        <IconSymbol name="email" size={16} color={ACCENT} />
        <Text style={s.text}>{email}</Text>
      </TouchableOpacity>
      <Text style={s.times}>Check-in: {checkInTime} · Check-out: {checkOutTime}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  title: {
    fontSize: 14, fontWeight: '700', color: '#1A3C5E', marginBottom: 10,
    letterSpacing: -0.2, fontFamily: FONTS.sora,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  text: { fontSize: 13, color: ACCENT, fontWeight: '500' },
  times: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
});
