/**
 * Filter Modal Component
 * Advanced filtering options for hotel search
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface FilterOptions {
  priceRange: [number, number];
  rating: number;
  amenities: string[];
  roomTypes: string[];
  bedTypes: string[];
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

const AMENITIES = [
  { id: 'wifi', name: 'WiFi', icon: '📶' },
  { id: 'pool', name: 'Swimming Pool', icon: '🏊' },
  { id: 'gym', name: 'Fitness Center', icon: '💪' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'parking', name: 'Parking', icon: '🅿️' },
  { id: 'spa', name: 'Spa', icon: '✨' },
  { id: 'ac', name: 'Air Conditioning', icon: '❄️' },
  { id: 'tv', name: 'TV', icon: '📺' },
];

const ROOM_TYPES = ['Single', 'Double', 'Suite', 'Deluxe', 'Studio'];
const BED_TYPES = ['Single Bed', 'Double Bed', 'Queen Bed', 'King Bed'];

export function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters,
}: FilterModalProps) {
  const colors = useColors();
  const [filters, setFilters] = useState<FilterOptions>(
    initialFilters || {
      priceRange: [0, 50000],
      rating: 0,
      amenities: [],
      roomTypes: [],
      bedTypes: [],
    }
  );

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      priceRange: [0, 50000],
      rating: 0,
      amenities: [],
      roomTypes: [],
      bedTypes: [],
    });
  };

  const toggleAmenity = (amenityId: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((id) => id !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const toggleRoomType = (roomType: string) => {
    setFilters((prev) => ({
      ...prev,
      roomTypes: prev.roomTypes.includes(roomType)
        ? prev.roomTypes.filter((rt) => rt !== roomType)
        : [...prev.roomTypes, roomType],
    }));
  };

  const toggleBedType = (bedType: string) => {
    setFilters((prev) => ({
      ...prev,
      bedTypes: prev.bedTypes.includes(bedType)
        ? prev.bedTypes.filter((bt) => bt !== bedType)
        : [...prev.bedTypes, bedType],
    }));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-auto bg-background rounded-t-3xl">
          {/* Header */}
          <View className="px-6 py-6 border-b border-border flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-2xl text-muted">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-6 py-6"
          >
            {/* Rating Filter */}
            <View className="gap-3 mb-6">
              <Text className="text-lg font-bold text-foreground">Minimum Rating</Text>
              <View className="flex-row gap-2">
                {[0, 3, 3.5, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => setFilters((prev) => ({ ...prev, rating }))}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      backgroundColor: filters.rating === rating ? colors.primary : colors.surface,
                      borderColor: filters.rating === rating ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      className={cn(
                        'text-sm font-semibold text-center',
                        filters.rating === rating ? 'text-white' : 'text-foreground'
                      )}
                    >
                      {rating === 0 ? 'Any' : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amenities Filter */}
            <View className="gap-3 mb-6">
              <Text className="text-lg font-bold text-foreground">Amenities</Text>
              <View className="flex-row gap-2 flex-wrap">
                {AMENITIES.map((amenity) => (
                  <TouchableOpacity
                    key={amenity.id}
                    onPress={() => toggleAmenity(amenity.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      backgroundColor: filters.amenities.includes(amenity.id) ? colors.primary : colors.surface,
                      borderColor: filters.amenities.includes(amenity.id) ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      className={cn(
                        'text-xs font-semibold',
                        filters.amenities.includes(amenity.id)
                          ? 'text-white'
                          : 'text-foreground'
                      )}
                    >
                      {amenity.icon} {amenity.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Room Type Filter */}
            <View className="gap-3 mb-6">
              <Text className="text-lg font-bold text-foreground">Room Type</Text>
              <View className="gap-2">
                {ROOM_TYPES.map((roomType) => (
                  <TouchableOpacity
                    key={roomType}
                    onPress={() => toggleRoomType(roomType)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        borderWidth: 2,
                        backgroundColor: filters.roomTypes.includes(roomType) ? colors.primary : 'transparent',
                        borderColor: filters.roomTypes.includes(roomType) ? colors.primary : colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {filters.roomTypes.includes(roomType) && (
                        <Text className="text-white text-center text-xs">✓</Text>
                      )}
                    </View>
                    <Text className="text-sm font-semibold text-foreground">{roomType}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bed Type Filter */}
            <View className="gap-3 mb-6">
              <Text className="text-lg font-bold text-foreground">Bed Type</Text>
              <View className="gap-2">
                {BED_TYPES.map((bedType) => (
                  <TouchableOpacity
                    key={bedType}
                    onPress={() => toggleBedType(bedType)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                  >
                    <View
                      className={cn(
                        'w-6 h-6 rounded border-2',
                        filters.bedTypes.includes(bedType)
                          ? 'bg-primary border-primary'
                          : 'border-border'
                      )}
                    >
                      {filters.bedTypes.includes(bedType) && (
                        <Text className="text-white text-center text-xs">✓</Text>
                      )}
                    </View>
                    <Text className="text-sm font-semibold text-foreground">{bedType}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="px-6 py-6 gap-3 border-t border-border">
            <View className="flex-row gap-3">
              <Button
                onPress={handleReset}
                variant="secondary"
                size="lg"
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                onPress={handleApply}
                variant="primary"
                size="lg"
                className="flex-1"
              >
                Apply Filters
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
