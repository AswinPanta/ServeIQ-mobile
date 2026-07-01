/**
 * Favorites Screen
 * Display saved/wishlist hotels
 */

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { HotelCard } from '@/components/feature/hotel-card';
import { useFavorites } from '@/lib/context/favorites-context';
import { useColors } from '@/hooks/use-colors';

export default function FavoritesScreen() {
  const colors = useColors();
  const { favorites, removeFavorite } = useFavorites();

  // Mock hotels data
  const allHotels: Record<string, any> = {
    '1': {
      id: '1',
      name: 'Grand Hotel Kathmandu',
      city: 'Kathmandu',
      country: 'Nepal',
      rating: 4.8,
      review_count: 342,
      currency: 'NPR',
      check_in_time: '14:00',
      photos: [{ url: 'https://via.placeholder.com/400x300?text=Hotel+1', caption: 'Main' }],
      amenities: [
        { id: 'wifi', name: 'WiFi', icon: '📶', category: 'room' },
        { id: 'pool', name: 'Pool', icon: '🏊', category: 'facility' },
      ],
    },
    '2': {
      id: '2',
      name: 'Lakeside Resort Pokhara',
      city: 'Pokhara',
      country: 'Nepal',
      rating: 4.6,
      review_count: 256,
      currency: 'NPR',
      check_in_time: '15:00',
      photos: [{ url: 'https://via.placeholder.com/400x300?text=Hotel+2', caption: 'Main' }],
      amenities: [
        { id: 'wifi', name: 'WiFi', icon: '📶', category: 'room' },
        { id: 'restaurant', name: 'Restaurant', icon: '🍽️', category: 'facility' },
      ],
    },
  };

  const favoriteHotels = favorites
    .map((id) => allHotels[id])
    .filter(Boolean);

  const handleHotelPress = (hotel: any) => {
    router.push({
      pathname: '/guest-hotel-detail/[id]',
      params: { id: hotel.id, checkIn: '', checkOut: '', guests: '1' },
    });
  };

  const handleRemoveFavorite = (hotelId: string) => {
    removeFavorite(hotelId);
  };

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      {/* Header */}
      <View className="px-6 py-6 border-b border-border">
        <Text className="text-3xl font-bold text-foreground">My Favorites</Text>
        <Text className="text-sm text-muted mt-1">
          {favoriteHotels.length} hotel{favoriteHotels.length !== 1 ? 's' : ''} saved
        </Text>
      </View>

      {/* Favorites List */}
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
                hotel={item}
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
