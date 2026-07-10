/**
 * Nearby Hotels Component
 * Shows hotels sorted by proximity to user's current location
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { calculateDistance, type UserLocation } from '@/hooks/use-location';

interface NearbyHotel {
  id: string;
  name: string;
  city: string;
  price: number;
  currency: string;
  rating: number;
  review_count: number;
  image: string;
  latitude: number;
  longitude: number;
}

interface NearbyHotelsProps {
  hotels: NearbyHotel[];
  userLocation: UserLocation | null;
  loading: boolean;
}

export function NearbyHotels({ hotels, userLocation, loading }: NearbyHotelsProps) {
  if (loading) {
    return (
      <View className="px-6 py-8 gap-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="location" size={20} color="#E63946" />
          <Text className="text-2xl font-bold text-foreground">Nearby Hotels</Text>
        </View>
        <View className="h-32 bg-surface rounded-xl animate-pulse" />
      </View>
    );
  }

  if (!userLocation) {
    return null;
  }

  const hotelsWithDistance = hotels
    .map((hotel) => ({
      ...hotel,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        hotel.latitude,
        hotel.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  if (hotelsWithDistance.length === 0) return null;

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)} km`;
  };

  return (
    <View className="py-8 gap-4">
      <View className="px-6 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="location" size={20} color="#E63946" />
          <Text className="text-2xl font-bold text-foreground">Nearby Hotels</Text>
        </View>
        <Text className="text-xs text-muted">
          {userLocation.city ? `in ${userLocation.city}` : 'from your location'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, gap: 12 }}
      >
        {hotelsWithDistance.map((hotel) => (
          <TouchableOpacity
            key={hotel.id}
            onPress={() => router.push({
              pathname: '/guest-hotel-detail/[id]',
              params: { id: hotel.id },
            })}
            activeOpacity={0.7}
            className="w-56 rounded-2xl overflow-hidden bg-surface"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Image
              source={{ uri: hotel.image }}
              className="w-full h-28"
              resizeMode="cover"
            />
            <View className="p-3 gap-2">
              <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                {hotel.name}
              </Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name="location-outline" size={12} color="#888" />
                <Text className="text-xs text-muted" numberOfLines={1}>
                  {hotel.city} · {formatDistance(hotel.distance)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mt-1">
                <View className="flex-row items-center gap-1">
                  <Text className="text-yellow-400 text-xs">★</Text>
                  <Text className="text-xs font-semibold text-foreground">{hotel.rating}</Text>
                  <Text className="text-xs text-muted">({hotel.review_count})</Text>
                </View>
                <Text className="text-sm font-bold text-primary">
                  {hotel.currency} {hotel.price.toLocaleString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
