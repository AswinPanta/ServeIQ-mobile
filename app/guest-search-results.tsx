/**
 * Guest Search Results Screen
 * Search results accessible without authentication
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { HotelCard } from '@/components/feature/hotel-card';
import { FilterModal } from '@/components/feature/filter-modal';
import { UrgencyBadge } from '@/components/feature/urgency-badge';
import { useColors } from '@/hooks/use-colors';
import { MOCK_PROPERTIES, searchHotels } from '@/lib/mock/properties';

export default function GuestSearchResults() {
  const colors = useColors();
  const { location, checkIn, checkOut, guests } = useLocalSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('rating');
  const [filters, setFilters] = useState<{
    priceRange: [number, number];
    rating: number;
    amenities: string[];
    roomTypes: string[];
    bedTypes: string[];
  }>({
    priceRange: [0, 50000],
    rating: 0,
    amenities: [],
    roomTypes: [],
    bedTypes: [],
  });

  const filteredHotels = MOCK_PROPERTIES.filter((hotel) => {
    if (hotel.price < filters.priceRange[0] || hotel.price > filters.priceRange[1]) {
      return false;
    }
    if (hotel.rating < filters.rating) {
      return false;
    }
    if (filters.amenities.length > 0) {
      const hasAll = filters.amenities.some((a) => hotel.amenities.some(ha => ha.name === a));
      if (!hasAll) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

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

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
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
          data={filteredHotels}
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
                  description: item.shortDescription || item.description,
                  property_type: 'Hotel',
                  address: item.address,
                  city: item.city,
                  country: item.country,
                  latitude: item.coordinates?.lat || 0,
                  longitude: item.coordinates?.lng || 0,
                  phone: item.phone,
                  email: item.email,
                  rating: item.rating,
                  review_count: item.review_count,
                  photos: item.images.map((img, idx) => ({ url: '', caption: '', id: String(idx), order: idx })),
                  amenities: item.amenities.map(a => ({ id: a.name, name: a.name, icon: a.icon, category: 'other' })),
                  check_in_time: item.checkInTime,
                  check_out_time: item.checkOutTime,
                  cancellation_policy: item.cancellationPolicy,
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
