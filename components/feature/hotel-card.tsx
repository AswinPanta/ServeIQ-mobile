/**
 * Hotel Card Component
 * Displays hotel information in a card format
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Hotel } from '@/types/api';

interface HotelCardProps {
  hotel: Hotel;
  onPress?: () => void;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
}

export function HotelCard({
  hotel,
  onPress,
  isFavorite = false,
  onFavoritePress,
}: HotelCardProps) {
  const colors = useColors();
  const mainImage = hotel.photos?.[0]?.url || 'https://via.placeholder.com/400x300?text=Hotel';
  
  // Determine if image is a URI string or a require() object
  const imageSource = typeof mainImage === 'string' 
    ? { uri: mainImage }
    : mainImage;

  const minPrice = 5000;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {/* Image Container */}
        <View className="relative w-full h-48 bg-surface">
          <Image
            source={imageSource}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Rating Badge */}
          <View className="absolute top-3 left-3 bg-primary/90 rounded-full px-2 py-1 flex-row items-center gap-1">
            <Text className="text-yellow-300 font-bold">★</Text>
            <Text className="text-white font-semibold text-sm">{hotel.rating.toFixed(1)}</Text>
          </View>

          {/* Favorite Button */}
          <TouchableOpacity
            onPress={onFavoritePress}
            style={{ position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text className={cn('text-xl', isFavorite ? 'text-error' : 'text-muted')}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          {/* Price Badge */}
          <View className="absolute bottom-3 right-3 bg-primary/90 rounded-lg px-3 py-1">
            <Text className="text-white font-bold text-sm">
              {hotel.currency} {minPrice.toLocaleString()}+
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="p-4 gap-2">
          {/* Hotel Name */}
          <Text className="text-lg font-bold text-foreground" numberOfLines={2}>
            {hotel.name}
          </Text>

          {/* Location */}
          <View className="flex-row items-center gap-1">
            <Text className="text-sm text-muted">📍</Text>
            <Text className="text-sm text-muted flex-1" numberOfLines={1}>
              {hotel.city}, {hotel.country}
            </Text>
          </View>

          {/* Review Count */}
          <Text className="text-xs text-muted">
            {hotel.review_count} reviews
          </Text>

          {/* Amenities Preview */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <View className="flex-row gap-2 mt-2 flex-wrap">
              {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                <View
                  key={`${amenity.name}-${idx}`}
                  className="bg-surface rounded-full px-2 py-1"
                >
                  <Text className="text-xs text-foreground">{amenity.icon} {amenity.name}</Text>
                </View>
              ))}
              {hotel.amenities.length > 3 && (
                <View className="bg-surface rounded-full px-2 py-1">
                  <Text className="text-xs text-muted">+{hotel.amenities.length - 3}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}
