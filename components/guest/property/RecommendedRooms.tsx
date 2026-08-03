import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FONTS } from '@/constants/portal-theme';
import type { Hotel } from '@/types/api';

const ACCENT = '#2E86AB';

interface RecommendedRoomsProps {
  hotels: Hotel[];
  city: string;
  onHotelPress: (id: string) => void;
}

export function RecommendedRooms({ hotels, city, onHotelPress }: RecommendedRoomsProps) {
  if (hotels.length === 0) return null;

  return (
    <View>
      <Text style={s.title}>More in {city}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={s.row}>
          {hotels.map((h) => (
            <TouchableOpacity
              key={h.id}
              onPress={() => onHotelPress(h.id)}
              style={s.card}
              activeOpacity={0.8}
            >
              <Image source={{ uri: h.images[0] }} style={s.img} resizeMode="cover" />
              <View style={s.info}>
                <Text style={s.name} numberOfLines={1}>{h.name}</Text>
                <Text style={s.price}>
                  {h.currency} {h.price.toLocaleString()}
                  <Text style={s.perNight}> night</Text>
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  title: {
    fontSize: 14, fontWeight: '700', color: '#1A3C5E', marginBottom: 10,
    letterSpacing: -0.2, fontFamily: FONTS.sora,
  },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    width: 160, borderRadius: 12, backgroundColor: '#F8FAFC',
    borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden',
  },
  img: { width: '100%', height: 100 },
  info: { padding: 10, gap: 2 },
  name: { fontSize: 12, fontWeight: '600', color: '#1A3C5E' },
  price: { fontSize: 12, fontWeight: '700', color: ACCENT, marginTop: 1 },
  perNight: { fontSize: 10, fontWeight: '400', color: '#94A3B8' },
});
