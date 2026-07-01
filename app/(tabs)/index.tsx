/**
 * Home/Explore Screen
 * Landing page with hero section, featured destinations, and popular hotels
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { HeroSection } from '@/components/feature/hero-section';
import { DestinationCard } from '@/components/feature/destination-card';
import { HotelCard } from '@/components/feature/hotel-card';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { useAuth } from '@/lib/context/auth-context';
import { useFavorites } from '@/lib/context/favorites-context';
import { useColors } from '@/hooks/use-colors';
import { MOCK_PROPERTIES } from '@/lib/mock/properties';

export default function HomeScreen() {
  const colors = useColors();
  const { isSignedIn } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const [hotels, setHotels] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for destinations
  const mockDestinations = [
    {
      id: '1',
      name: 'Kathmandu',
      image: 'https://via.placeholder.com/300x400?text=Kathmandu',
      hotelCount: 45,
    },
    {
      id: '2',
      name: 'Pokhara',
      image: 'https://via.placeholder.com/300x400?text=Pokhara',
      hotelCount: 32,
    },
    {
      id: '3',
      name: 'Bhaktapur',
      image: 'https://via.placeholder.com/300x400?text=Bhaktapur',
      hotelCount: 18,
    },
    {
      id: '4',
      name: 'Chitwan',
      image: 'https://via.placeholder.com/300x400?text=Chitwan',
      hotelCount: 28,
    },
  ];

  // Use MOCK_PROPERTIES for popular hotels
  const mockHotels = MOCK_PROPERTIES.map(h => ({
    id: h.id,
    name: h.name,
    city: h.city,
    country: h.country,
    rating: h.rating,
    review_count: h.review_count,
    currency: h.currency,
    check_in_time: h.checkInTime,
    photos: h.images.map((img, idx) => ({ url: '', caption: '', id: String(idx) })),
    amenities: h.amenities.map(a => ({ id: a.name, name: a.name, icon: a.icon, category: 'other' })),
  }));

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setDestinations(mockDestinations);
      setHotels(mockHotels);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleSearch = () => {
    Alert.alert('Search', 'Navigate to search screen');
  };

  const handleDestinationPress = (destination: any) => {
    Alert.alert('Destination', `Search for ${destination.name}`);
  };

  const handleHotelPress = (hotel: any) => {
    Alert.alert('Hotel', `View details for ${hotel.name}`);
  };

  const handleFavoritePress = (hotelId: string) => {
    if (isFavorite(hotelId)) {
      removeFavorite(hotelId);
    } else {
      addFavorite(hotelId);
    }
  };

  if (!isSignedIn) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-foreground mb-4">Welcome to Stay Easy</Text>
        <Text className="text-base text-muted text-center mb-8">
          Please sign in to continue
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Hero Section */}
        <HeroSection
          title="Find Your Perfect Stay"
          subtitle="Explore amazing hotels and restaurants"
          onSearchPress={handleSearch}
          onExplorePress={handleSearch}
        />

        {/* Featured Destinations */}
        <View className="px-6 py-8 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">Featured Destinations</Text>
            <Text className="text-sm text-primary font-semibold">See All</Text>
          </View>

          {isLoading ? (
            <View className="h-48 bg-surface rounded-lg" />
          ) : (
            <FlatList
              data={destinations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <DestinationCard
                  {...item}
                  onPress={() => handleDestinationPress(item)}
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 12 }}
            />
          )}
        </View>

        {/* Popular Hotels */}
        <View className="px-6 py-8 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">Popular Hotels</Text>
            <Text className="text-sm text-primary font-semibold">See All</Text>
          </View>

          {isLoading ? (
            <SkeletonList count={3} showImage />
          ) : (
            <FlatList
              data={hotels}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <HotelCard
                  hotel={item}
                  onPress={() => handleHotelPress(item)}
                  isFavorite={isFavorite(item.id)}
                  onFavoritePress={() => handleFavoritePress(item.id)}
                />
              )}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 16 }}
            />
          )}
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
