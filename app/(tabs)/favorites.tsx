import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import type { Hotel } from '@/types/api';
import { HotelCard } from '@/components/feature/hotel-card';
import { useFavorites } from '@/lib/context/favorites-context';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTranslation } from 'react-i18next';
import { SLATE, BRAND } from '@/lib/constants/figma-tokens';

/**
 * Merge favoritesData (backend Hotel objects) with MOCK_PROPERTIES by ID.
 * Backend data takes precedence so properties added via API show up even
 * if they're not in the mock dataset.
 */
function useFavoriteHotels(): Hotel[] {
  const { favoritesList, favoritesData } = useFavorites();
  return React.useMemo(() => {
    const mockById = new Map(MOCK_PROPERTIES.map(m => [m.id, m]));
    return favoritesList
      .map(id => {
        const key = String(id);
        if (favoritesData[key]) return favoritesData[key];
        const mock = mockById.get(key);
        if (mock) {
          // Convert mock Hotel to API Hotel shape
          return {
            id: mock.id,
            name: mock.name,
            location: mock.location,
            city: mock.city,
            country: mock.country,
            address: mock.address,
            rating: mock.rating,
            review_count: mock.review_count,
            starRating: mock.starRating,
            price: mock.price,
            currency: mock.currency,
            property_type: mock.property_type ?? 'Hotel',
            description: mock.description,
            shortDescription: mock.shortDescription,
            images: mock.images,
            amenities: mock.amenities.map(a => ({ id: a.name, name: a.name, icon: a.icon, category: 'other' as const })),
            roomTypes: mock.roomTypes as any[],
            reviews: mock.reviews as any[],
            cancellationPolicy: mock.cancellationPolicy,
            checkInTime: mock.checkInTime,
            checkOutTime: mock.checkOutTime,
            phone: mock.phone,
            email: mock.email,
            website: mock.website,
            coordinates: mock.coordinates,
            availableRooms: mock.availableRooms,
            tags: mock.tags,
            photos: mock.images.map((url, idx) => ({ url, caption: '', id: String(idx), order: idx })),
          } as Hotel;
        }
        return null;
      })
      .filter(Boolean) as Hotel[];
  }, [favoritesList, favoritesData]);
}

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { removeFavorite } = useFavorites();
  const favoriteHotels = useFavoriteHotels();

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <View style={s.header}>
        <Text style={s.title}>{t('profile.favorites.title')}</Text>
        <Text style={s.count}>
          {t('profile.favorites.count', { n: favoriteHotels.length, count: favoriteHotels.length })}
        </Text>
      </View>

      {favoriteHotels.length === 0 ? (
        <View style={s.emptyState}>
          <View style={s.emptyIcon}>
            <IconSymbol name="heart.fill" size={32} color={SLATE[200]} />
          </View>
          <Text style={s.emptyTitle}>{t('profile.favorites.empty')}</Text>
          <Text style={s.emptyDesc}>{t('profile.favorites.emptyDesc')}</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteHotels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={s.cardWrap}>
              <HotelCard
                hotel={item}
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
  title: { fontSize: 24, fontWeight: '700', color: BRAND.navyLight, letterSpacing: -0.5 },
  count: { fontSize: 13, color: SLATE[400] },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  cardWrap: { marginBottom: 16 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: SLATE[50], alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: BRAND.navyLight },
  emptyDesc: { fontSize: 14, color: SLATE[400], textAlign: 'center', lineHeight: 20 },
});
