import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import type { Hotel } from '@/types/api';
import { HotelCard } from '@/components/feature/hotel-card';
import { useFavorites } from '@/lib/context/favorites-context';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function FavoritesScreen() {
  const { favoritesList, removeFavorite } = useFavorites();
  const favoriteHotels = MOCK_PROPERTIES.filter(h => favoritesList.includes(h.id));

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <View style={s.header}>
        <Text style={s.title}>Saved</Text>
        <Text style={s.count}>
          {favoriteHotels.length} hotel{favoriteHotels.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {favoriteHotels.length === 0 ? (
        <View style={s.emptyState}>
          <View style={s.emptyIcon}>
            <IconSymbol name="heart.fill" size={32} color="#E2E8F0" />
          </View>
          <Text style={s.emptyTitle}>No saved hotels yet</Text>
          <Text style={s.emptyDesc}>Tap the heart icon on any hotel to save it here</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteHotels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={s.cardWrap}>
              <HotelCard
                hotel={{
                  id: item.id, name: item.name,
                  description: item.shortDescription || item.description,
                  property_type: 'Hotel' as const, address: item.address,
                  city: item.city, country: item.country,
                  latitude: item.coordinates?.lat || 0, longitude: item.coordinates?.lng || 0,
                  phone: item.phone, email: item.email,
                  rating: item.rating, review_count: item.review_count,
                  price: item.price, currency: item.currency,
                  check_in_time: item.checkInTime, check_out_time: item.checkOutTime,
                  cancellation_policy: item.cancellationPolicy,
                  photos: item.images.map((url, idx) => ({ url, caption: '', id: String(idx), order: idx })),
                  amenities: item.amenities.map(a => ({ id: a.name, name: a.name, icon: a.icon, category: 'other' as const })),
                  created_at: new Date().toISOString(), updated_at: new Date().toISOString(), website: item.website,
                } as Hotel}
                onPress={() => router.push({ pathname: '/guest-hotel-detail/[id]', params: { id: item.id } })}
                isFavorite={true}
                onFavoritePress={() => removeFavorite(item.id)}
              />
            </View>
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12, gap: 2 },
  title: { fontSize: 24, fontWeight: '700', color: '#1A3C5E', letterSpacing: -0.5 },
  count: { fontSize: 13, color: '#94A3B8' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  cardWrap: { marginBottom: 16 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A3C5E' },
  emptyDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});
