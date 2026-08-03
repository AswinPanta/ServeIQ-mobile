import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { FONTS } from '@/constants/portal-theme';

interface Amenity {
  name: string;
  icon?: string;
}

interface AmenitiesSectionProps {
  amenities: Amenity[];
}

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? amenities : amenities.slice(0, 8);

  return (
    <View>
      <Text style={s.title}>Amenities</Text>
      <View style={s.list}>
        {displayed.map((a) => (
          <View key={a.name} style={s.row}>
            <IconSymbol name={(a.icon || 'wifi') as any} size={16} color="#1A3C5E" />
            <Text style={s.text}>{a.name}</Text>
          </View>
        ))}
      </View>
      {amenities.length > 8 && (
        <TouchableOpacity onPress={() => setShowAll((v) => !v)} style={s.showMoreBtn}>
          <Text style={s.showMoreText}>
            {showAll ? 'Show less' : `Show all ${amenities.length}`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  title: {
    fontSize: 14, fontWeight: '700', color: '#1A3C5E', marginBottom: 10,
    letterSpacing: -0.2, fontFamily: FONTS.sora,
  },
  list: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  text: { fontSize: 13, color: '#1A3C5E' },
  showMoreBtn: {
    marginTop: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    borderColor: '#1A3C5E', alignItems: 'center',
  },
  showMoreText: { fontSize: 12, fontWeight: '600', color: '#1A3C5E' },
});
