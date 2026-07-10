import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { HotelCard } from '@/components/feature/hotel-card';
import { useFavorites } from '@/lib/context/favorites-context';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';

export default function FavoritesScreen() {
  const { favoritesList, removeFavorite } = useFavorites();

  const favoriteHotels = MOCK_PROPERTIES.filter(h => favoritesList.includes(h.id));

  const handleHotelPress = (hotel: any) => {
    router.push({
      pathname: '/hotel-detail-full/[id]',
      params: { id: hotel.id },
    });
  };

  const handleRemoveFavorite = (hotelId: string) => {
    removeFavorite(hotelId);
  };

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <View className="px-6 py-6 border-b border-border">
        <Text className="text-3xl font-bold text-foreground">My Favorites</Text>
        <Text className="text-sm text-muted mt-1">
          {favoriteHotels.length} hotel{favoriteHotels.length !== 1 ? 's' : ''} saved
        </Text>
      </View>

      {favoriteHotels.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-3xl mb-4">❤️</Text>
          <Text className="text-2xl font-bold text-foreground mb-2">No Favorites Yet</Text>
          <Text className="text-base text-muted text-center">
            Start adding hotels to your favorites to see them here
          </Text>
        </View>
      ) : (
        <FlatList
          data={favoriteHotels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-6 py-3">
              <HotelCard
                hotel={{
                  id: item.id,
                  name: item.name,
                  description: item.shortDescription || item.description,
                  property_type: 'Hotel' as const,
                  address: item.address,
                  city: item.city,
                  country: item.country,
                  latitude: item.coordinates?.lat || 0,
                  longitude: item.coordinates?.lng || 0,
                  phone: item.phone,
                  email: item.email,
                  rating: item.rating,
                  review_count: item.review_count,
                  price: item.price,
                  currency: item.currency,
                  check_in_time: item.checkInTime,
                  check_out_time: item.checkOutTime,
                  cancellation_policy: item.cancellationPolicy,
                  photos: item.images.map((url, idx) => ({ url, caption: '', id: String(idx), order: idx })),
                  amenities: item.amenities.map(a => ({ id: a.name, name: a.name, icon: a.icon, category: 'other' as const })),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  website: item.website,
                }}
                onPress={() => handleHotelPress(item)}
                isFavorite={true}
                onFavoritePress={() => handleRemoveFavorite(item.id)}
              />
            </View>
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View className="h-8" />}
        />
      )}
    </ScreenContainer>
  );
}
