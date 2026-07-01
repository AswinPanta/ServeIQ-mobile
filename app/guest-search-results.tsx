/**
 * Guest Search Results Screen
 * Search results accessible without authentication
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { HotelCard } from '@/components/feature/hotel-card';
import { FilterModal } from '@/components/feature/filter-modal';
import { UrgencyBadge } from '@/components/feature/urgency-badge';
import { useColors } from '@/hooks/use-colors';

const MOCK_HOTELS = [
  {
    id: '1',
    name: 'Grand Hotel Kathmandu',
    address: 'Thamel, Kathmandu',
    city: 'Kathmandu',
    country: 'Nepal',
    price: 8000,
    currency: 'NPR',
    rating: 4.8,
    review_count: 342,
    image: require('@/assets/images/hotel-1.jpg'),
    amenities: ['WiFi', 'Pool', 'Gym'],
    availableRooms: 5,
  },
  {
    id: '2',
    name: 'Budget Inn',
    address: 'Kathmandu',
    city: 'Kathmandu',
    country: 'Nepal',
    price: 3500,
    currency: 'NPR',
    rating: 4.2,
    review_count: 156,
    image: require('@/assets/images/hotel-2.jpg'),
    amenities: ['WiFi', 'AC'],
    availableRooms: 2,
  },
  {
    id: '3',
    name: 'Luxury Suites',
    address: 'Kathmandu',
    city: 'Kathmandu',
    country: 'Nepal',
    price: 15000,
    currency: 'NPR',
    rating: 4.9,
    review_count: 418,
    image: require('@/assets/images/hotel-3.jpg'),
    amenities: ['WiFi', 'Pool', 'Gym', 'Spa'],
    availableRooms: 1,
  },
];

export default function GuestSearchResults() {
  const colors = useColors();
  const { location, checkIn, checkOut, guests } = useLocalSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('rating');

  const handleHotelPress = (hotelId: string) => {
    router.push({
      pathname: '/guest-hotel-detail/[id]',
      params: {
        id: hotelId,
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        guests: guests || '1',
      },
    });
  };

  const handleApplyFilters = (filters: any) => {
    // Apply filters logic here
    console.log('Filters applied:', filters);
  };

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      {/* Header */}
      <View className="px-6 py-4 border-b border-border flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground flex-1 ml-4">Search Results</Text>
      </View>

      {/* Search Summary */}
      <View className="px-6 py-4 gap-2 bg-surface">
        <Text className="text-base font-semibold text-foreground">
          {location} • {guests} guest{guests !== '1' ? 's' : ''}
        </Text>
        <Text className="text-sm text-muted">
          {checkIn} to {checkOut}
        </Text>
      </View>

      {/* Filter & Sort Bar */}
      <View className="px-6 py-4 flex-row gap-3 border-b border-border">
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
        >
          <Text className="text-sm font-semibold text-foreground">🔍 Filters</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSortBy(sortBy === 'price' ? 'rating' : 'price')}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: `${colors.primary}10` }}
        >
          <Text className="text-sm font-semibold text-primary">
            {sortBy === 'price' ? '💰 Price' : '⭐ Rating'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hotels List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-6 py-6"
      >
        <FlatList
          data={MOCK_HOTELS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleHotelPress(item.id)}
              style={{ marginBottom: 16 }}
            >
              <HotelCard
                hotel={{
                  id: item.id,
                  name: item.name,
                  description: '',
                  property_type: 'Hotel',
                  address: item.address,
                  city: item.city,
                  country: item.country,
                  latitude: 0,
                  longitude: 0,
                  phone: '',
                  email: '',
                  rating: item.rating,
                  review_count: item.review_count,
                  photos: [{ url: '', caption: '', id: '1', order: 1 }],
                  amenities: item.amenities.map(name => ({ id: '1', name, icon: '✓', category: 'other' })),
                  check_in_time: '14:00',
                  check_out_time: '11:00',
                  cancellation_policy: 'Free cancellation',
                  currency: item.currency,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }}
              />
              <View style={{ marginTop: 4 }}>
                <UrgencyBadge count={item.availableRooms} />
              </View>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-4xl mb-4">🏨</Text>
              <Text className="text-lg font-semibold text-foreground">No hotels found</Text>
              <Text className="text-sm text-muted text-center mt-2">
                Try adjusting your search criteria
              </Text>
            </View>
          }
        />
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
      />
    </ScreenContainer>
  );
}
