import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

const ACCENT = '#2E86AB';

interface HostInfoProps {
  hotelName: string;
}

export function HostInfo({ hotelName }: HostInfoProps) {
  return (
    <View style={s.container}>
      <View style={s.avatar}>
        <IconSymbol name="person.fill" size={20} color={ACCENT} />
      </View>
      <View style={s.info}>
        <Text style={s.name}>Hosted by {hotelName.split(' ')[0]}</Text>
        <Text style={s.meta}>2 years hosting · Verified</Text>
      </View>
      <View style={s.badge}>
        <Text style={s.badgeText}>★ Superhost</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(46,134,171,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: '#1A3C5E' },
  meta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(46,134,171,0.1)' },
  badgeText: { fontSize: 10, fontWeight: '600', color: ACCENT },
});
