import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS } from '@/constants/portal-theme';
import type { Hotel } from '@/types/api';
import { BG, SLATE, BRAND, STATUS_COLORS } from '@/lib/constants/figma-tokens';

interface HotelHeaderProps {
  hotel: Hotel;
}

export function HotelHeader({ hotel }: HotelHeaderProps) {
  return (
    <View style={s.container}>
      <View style={s.titleRow}>
        {hotel.logoUrl && (
          <Image source={{ uri: hotel.logoUrl }} style={s.logo} resizeMode="contain" />
        )}
        <View style={s.titleCol}>
          <Text style={s.name}>{hotel.name}</Text>
          {hotel.logoUrl && <Text style={s.ownerLabel}>Property Owner</Text>}
        </View>
      </View>
      <View style={s.ratingRow}>
        <View style={s.starBadge}>
          <IconSymbol name="star" size={12} color={BG.white} />
          <Text style={s.starText}>{hotel.rating}</Text>
        </View>
        <Text style={s.reviewCount}>({hotel.review_count} reviews)</Text>
        <Text style={s.dotSep}>·</Text>
        <Text style={s.locationText}>{hotel.city}, {hotel.country}</Text>
      </View>
      <Text style={s.metaText}>
        {hotel.roomTypes.length} rooms · Up to {hotel.roomTypes.length > 0 ? Math.max(...hotel.roomTypes.map((r: any) => r.occupancy)) : 0} guests
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, backgroundColor: BG.white, borderBottomWidth: 1, borderBottomColor: SLATE[100], gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleCol: { flex: 1 },
  logo: {
    width: 46, height: 46, borderRadius: 10, backgroundColor: SLATE[100],
    borderWidth: 1, borderColor: SLATE[200],
  },
  ownerLabel: { fontSize: 10, color: SLATE[400], marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: {
    fontSize: 22, fontWeight: '700', color: BRAND.navyLight, letterSpacing: -0.5,
    fontFamily: FONTS.playfairDisplay.bold,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: STATUS_COLORS.gold,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  starText: { fontSize: 10, fontWeight: '700', color: BG.white },
  reviewCount: { fontSize: 11, color: SLATE[400] },
  dotSep: { color: SLATE[300] },
  locationText: { fontSize: 11, color: SLATE[400] },
  metaText: { fontSize: 11, color: SLATE[400] },
});
