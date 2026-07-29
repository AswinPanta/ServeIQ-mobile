import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import type { Hotel } from '@/types/api';
import { HotelCard } from '@/components/feature/hotel-card';
import { AdvancedFilterModal, FilterState } from '@/components/feature/advanced-filter-modal';
import { CategoryFilter } from '@/components/feature/category-filter';
import { useFavorites } from '@/lib/context/favorites-context';
import { StickySearchHeader } from '@/components/StickySearchHeader';
import { useScrollRestoration } from '@/hooks/use-scroll-restoration';
import { searchHotelsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SearchResultsScreen() {
  const { location = 'Hotels', checkIn, checkOut, guests, adults, children, rooms } = useLocalSearchParams<{
    location?: string; checkIn?: string; checkOut?: string; guests?: string;
    adults?: string; children?: string; rooms?: string;
  }>();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [allHotels, setAllHotels] = useState<Hotel[]>(MOCK_PROPERTIES);
  const [isLoading, setIsLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('price');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    priceRange: [0, 50000],
    minRating: 3.0,
    amenities: [],
    roomTypes: [],
    bedTypes: [],
  });

  const scrollRef = useRef<FlatList>(null);
  const routeKey = '/search-results';
  const handleScroll = useScrollRestoration(scrollRef as any, routeKey);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const result = await searchHotelsApi({
        destination: location || '',
        checkIn: checkIn as string,
        checkOut: checkOut as string,
        adults: adults ? Number(adults) : (guests ? Number(guests) : 1),
        children: children ? Number(children) : 0,
        rooms: rooms ? Number(rooms) : 1,
      });
      if (!cancelled) {
        setAllHotels(result.hotels.length > 0 ? result.hotels : MOCK_PROPERTIES);
        setFromApi(result.fromApi);
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [location, checkIn, checkOut, guests, adults, children, rooms]);

  const filteredHotels = useMemo(() => {
    let filtered = allHotels.filter((hotel) => {
      if (hotel.price < activeFilters.priceRange[0] || hotel.price > activeFilters.priceRange[1]) {
        return false;
      }
      if (hotel.rating < activeFilters.minRating) {
        return false;
      }
      if (activeFilters.amenities.length > 0) {
        const hasAmenities = activeFilters.amenities.some((amenityId) =>
          hotel.amenities.some(a => a.name === amenityId)
        );
        if (!hasAmenities) return false;
      }
      return true;
    });

    if (sortBy === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  }, [allHotels, activeFilters, sortBy]);

  const handleHotelPress = (hotelId: string) => {
    router.push({
      pathname: '/hotel-detail-full/[id]',
      params: { id: hotelId },
    });
  };

  const handleFavoritePress = (hotelId: string) => {
    if (isFavorite(hotelId)) {
      removeFavorite(hotelId);
    } else {
      addFavorite(hotelId);
    }
  };

  const applyFilters = (filters: FilterState) => {
    setActiveFilters(filters);
  };

  const sortOptions = [
    { id: 'price', label: 'Price: Low to High' },
    { id: 'rating', label: 'Rating: High to Low' },
    { id: 'distance', label: 'Distance: Nearest' },
  ];

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <View className="px-6 py-4 border-b border-border">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">{location}</Text>
            <Text className="text-sm text-muted">{filteredHotels.length} hotels found</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="px-4 py-2 rounded-lg border border-border bg-surface"
          >
            <Text className="text-sm font-semibold text-foreground">⚙️ Filter</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-2">
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => setSortBy(option.id as any)}
              className={cn(
                'px-3 py-2 rounded-full border',
                sortBy === option.id
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-border'
              )}
            >
              <Text
                className={cn(
                  'text-xs font-semibold',
                  sortBy === option.id ? 'text-white' : 'text-foreground'
                )}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <CategoryFilter
        selected={selectedCategory}
        onChange={setSelectedCategory}
      />

      {filteredHotels.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-2xl font-bold text-foreground mb-2">No Hotels Found</Text>
          <Text className="text-base text-muted text-center">
            Try adjusting your search criteria
          </Text>
        </View>
      ) : (
        <FlatList ref={scrollRef} onScroll={handleScroll} scrollEventThrottle={16}
          data={filteredHotels}
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
                } as Hotel}
                onPress={() => handleHotelPress(item.id)}
                isFavorite={isFavorite(item.id)}
                onFavoritePress={() => handleFavoritePress(item.id)}
              />
            </View>
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View className="h-8" />}
        />
      )}

      <AdvancedFilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={applyFilters}
        initialFilters={activeFilters}
      />
    </ScreenContainer>
  );
}
