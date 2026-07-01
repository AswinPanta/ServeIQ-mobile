import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, Link } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { HotelCard } from '@/components/feature/hotel-card';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { AdvancedFilterModal, FilterState } from '@/components/feature/advanced-filter-modal';
import { useFavorites } from '@/lib/context/favorites-context';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export default function SearchResultsScreen() {
  const colors = useColors();
  const { location = 'Hotels' } = useLocalSearchParams<{ location: string }>();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [hotels, setHotels] = useState<any[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('price');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    priceRange: [0, 50000],
    minRating: 3.0,
    amenities: [],
    roomTypes: [],
    bedTypes: [],
  });

  const mockHotels = [
    {
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
        { id: 'gym', name: 'Gym', icon: '💪', category: 'facility' },
      ],
    },
    {
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
    {
      id: '3',
      name: 'Heritage Hotel Bhaktapur',
      city: 'Bhaktapur',
      country: 'Nepal',
      rating: 4.7,
      review_count: 189,
      currency: 'NPR',
      check_in_time: '14:00',
      photos: [{ url: 'https://via.placeholder.com/400x300?text=Hotel+3', caption: 'Main' }],
      amenities: [
        { id: 'wifi', name: 'WiFi', icon: '📶', category: 'room' },
        { id: 'parking', name: 'Parking', icon: '🅿️', category: 'facility' },
      ],
    },
    {
      id: '4',
      name: 'Mountain View Lodge',
      city: 'Nagarkot',
      country: 'Nepal',
      rating: 4.5,
      review_count: 145,
      currency: 'NPR',
      check_in_time: '14:00',
      photos: [{ url: 'https://via.placeholder.com/400x300?text=Hotel+4', caption: 'Main' }],
      amenities: [
        { id: 'wifi', name: 'WiFi', icon: '📶', category: 'room' },
        { id: 'gym', name: 'Gym', icon: '💪', category: 'facility' },
      ],
    },
    {
      id: '5',
      name: 'City Center Hotel',
      city: 'Kathmandu',
      country: 'Nepal',
      rating: 4.4,
      review_count: 267,
      currency: 'NPR',
      check_in_time: '15:00',
      photos: [{ url: 'https://via.placeholder.com/400x300?text=Hotel+5', caption: 'Main' }],
      amenities: [
        { id: 'wifi', name: 'WiFi', icon: '📶', category: 'room' },
        { id: 'restaurant', name: 'Restaurant', icon: '🍽️', category: 'facility' },
        { id: 'parking', name: 'Parking', icon: '🅿️', category: 'facility' },
      ],
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setHotels(mockHotels);
      setFilteredHotels(mockHotels);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    applyFilters(activeFilters);
  }, [sortBy]);

  const handleHotelPress = (hotel: any) => {
    router.push({
      pathname: '/hotel-detail-full/[id]',
      params: { id: hotel.id },
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
    let filtered = mockHotels.filter((hotel) => {
      const hotelPrice = parseInt(hotel.check_in_time.split(':')[0]) * 1000;
      if (hotelPrice < filters.priceRange[0] || hotelPrice > filters.priceRange[1]) {
        return false;
      }
      if (hotel.rating < filters.minRating) {
        return false;
      }
      if (filters.amenities.length > 0) {
        const hasAmenities = filters.amenities.some((amenityId) =>
          hotel.amenities.some((a: any) => a.id === amenityId)
        );
        if (!hasAmenities) return false;
      }
      return true;
    });

    if (sortBy === 'price') {
      filtered.sort((a, b) => parseInt(a.check_in_time.split(':')[0]) - parseInt(b.check_in_time.split(':')[0]));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'distance') {
      filtered.sort((a, b) => a.city.localeCompare(b.city));
    }

    setFilteredHotels(filtered);
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
            <Text className="text-sm text-muted">{hotels.length} hotels found</Text>
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

      {isLoading ? (
        <View className="flex-1 px-6 py-4">
          <SkeletonList count={3} showImage />
        </View>
      ) : hotels.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-2xl font-bold text-foreground mb-2">No Hotels Found</Text>
          <Text className="text-base text-muted text-center">
            Try adjusting your search criteria
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHotels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-6 py-3">
              <HotelCard
                hotel={item}
                onPress={() => handleHotelPress(item)}
                isFavorite={isFavorite(item.id)}
                onFavoritePress={() => handleFavoritePress(item.id)}
              />
            </View>
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View className="h-8" />
          }
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
