/**
 * Hotel Card Component
 * Displays hotel information in a card format
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Hotel } from '@/types/api';
import { CORAL } from '@/lib/constants/figma-tokens';

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
  const mainImage = hotel.photos?.[0]?.url || 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=400&h=300&fit=crop';
  
  // Determine if image is a URI string or a require() object
  const imageSource = typeof mainImage === 'string' 
    ? { uri: mainImage }
    : mainImage;

  const minPrice = 'price' in hotel ? (hotel as any).price : 5000;

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
          <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: (hotel.brandColor || CORAL[500]) + 'E6', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text className="text-yellow-300 font-bold">★</Text>
            <Text className="text-white font-semibold text-sm">{hotel.rating.toFixed(1)}</Text>
          </View>

          {/* Favorite Button */}
          <TouchableOpacity
            onPress={onFavoritePress}
            style={{ position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text className={cn('text-xl', isFavorite ? 'text-error' : 'text-muted')}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          {/* Price Badge */}
          <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: (hotel.brandColor || CORAL[500]) + 'E6', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
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

          {/* Description */}
          {hotel.description ? (
            <Text className="text-xs text-muted" numberOfLines={2}>
              {hotel.description}
            </Text>
          ) : null}

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
