import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS } from '@/constants/portal-theme';
import type { Hotel } from '@/types/api';

interface HotelHeaderProps {
  hotel: Hotel;
}

export function HotelHeader({ hotel }: HotelHeaderProps) {
  return (
    <View style={s.container}>
      <Text style={s.name}>{hotel.name}</Text>
      <View style={s.ratingRow}>
        <View style={s.starBadge}>
          <IconSymbol name="star" size={12} color="#FFF" />
          <Text style={s.starText}>{hotel.rating}</Text>
        </View>
        <Text style={s.reviewCount}>({hotel.review_count} reviews)</Text>
        <Text style={s.dotSep}>·</Text>
        <Text style={s.locationText}>{hotel.city}, {hotel.country}</Text>
      </View>
      <Text style={s.metaText}>
        {hotel.roomTypes.length} rooms · Up to {Math.max(...hotel.roomTypes.map((r: any) => r.occupancy))} guests
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 6 },
  name: {
    fontSize: 22, fontWeight: '700', color: '#1A3C5E', letterSpacing: -0.5,
    fontFamily: FONTS.playfairDisplay.bold,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FFD700',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  starText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  reviewCount: { fontSize: 11, color: '#94A3B8' },
  dotSep: { color: '#CBD5E1' },
  locationText: { fontSize: 11, color: '#94A3B8' },
  metaText: { fontSize: 11, color: '#94A3B8' },
});
