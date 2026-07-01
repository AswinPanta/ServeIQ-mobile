import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export interface FilterState {
  priceRange: [number, number];
  minRating: number;
  amenities: string[];
  roomTypes: string[];
  bedTypes: string[];
}

interface AdvancedFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters?: FilterState;
  isLoading?: boolean;
}

const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: '📶' },
  { id: 'pool', label: 'Pool', icon: '🏊' },
  { id: 'gym', label: 'Gym', icon: '💪' },
  { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { id: 'parking', label: 'Parking', icon: '🅿️' },
  { id: 'spa', label: 'Spa', icon: '💆' },
  { id: 'ac', label: 'Air Conditioning', icon: '❄️' },
  { id: 'heating', label: 'Heating', icon: '🔥' },
];

const ROOM_TYPES = [
  { id: 'single', label: 'Single' },
  { id: 'double', label: 'Double' },
  { id: 'suite', label: 'Suite' },
  { id: 'deluxe', label: 'Deluxe' },
];

const BED_TYPES = [
  { id: 'single', label: 'Single Bed' },
  { id: 'double', label: 'Double Bed' },
  { id: 'queen', label: 'Queen Bed' },
  { id: 'king', label: 'King Bed' },
];

export function AdvancedFilterModal({
  visible,
  onClose,
  onApply,
  initialFilters,
  isLoading = false,
}: AdvancedFilterModalProps) {
  const colors = useColors();
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      priceRange: [0, 50000],
      minRating: 3.0,
      amenities: [],
      roomTypes: [],
      bedTypes: [],
    }
  );

  const handlePriceRangeChange = (min: number, max: number) => {
    setFilters({ ...filters, priceRange: [min, max] });
  };

  const handleRatingChange = (rating: number) => {
    setFilters({ ...filters, minRating: rating });
  };

  const toggleAmenity = (amenityId: string) => {
    const updated = filters.amenities.includes(amenityId)
      ? filters.amenities.filter((id) => id !== amenityId)
      : [...filters.amenities, amenityId];
    setFilters({ ...filters, amenities: updated });
  };

  const toggleRoomType = (roomTypeId: string) => {
    const updated = filters.roomTypes.includes(roomTypeId)
      ? filters.roomTypes.filter((id) => id !== roomTypeId)
      : [...filters.roomTypes, roomTypeId];
    setFilters({ ...filters, roomTypes: updated });
  };

  const toggleBedType = (bedTypeId: string) => {
    const updated = filters.bedTypes.includes(bedTypeId)
      ? filters.bedTypes.filter((id) => id !== bedTypeId)
      : [...filters.bedTypes, bedTypeId];
    setFilters({ ...filters, bedTypes: updated });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      priceRange: [0, 50000],
      minRating: 3.0,
      amenities: [],
      roomTypes: [],
      bedTypes: [],
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View
          className="flex-1 mt-auto bg-background rounded-t-3xl"
          style={{ maxHeight: '90%' }}
        >
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Advanced Filters</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 items-center justify-center"
            >
              <Text className="text-2xl text-foreground">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
            <View className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-3">Price Range</Text>
              <View className="bg-surface rounded-lg p-4">
                <View className="flex-row justify-between mb-3">
                  <Text className="text-sm text-muted">Min: NPR {filters.priceRange[0]}</Text>
                  <Text className="text-sm text-muted">Max: NPR {filters.priceRange[1]}</Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handlePriceRangeChange(0, filters.priceRange[1])}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg',
                      filters.priceRange[0] === 0 ? 'bg-primary' : 'bg-surface border border-border'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-semibold text-center',
                        filters.priceRange[0] === 0 ? 'text-white' : 'text-foreground'
                      )}
                    >
                      0 - 10K
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handlePriceRangeChange(10000, filters.priceRange[1])}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg',
                      filters.priceRange[0] === 10000 ? 'bg-primary' : 'bg-surface border border-border'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-semibold text-center',
                        filters.priceRange[0] === 10000 ? 'text-white' : 'text-foreground'
                      )}
                    >
                      10K - 25K
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handlePriceRangeChange(25000, 50000)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg',
                      filters.priceRange[0] === 25000 ? 'bg-primary' : 'bg-surface border border-border'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-semibold text-center',
                        filters.priceRange[0] === 25000 ? 'text-white' : 'text-foreground'
                      )}
                    >
                      25K+
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-3">Minimum Rating</Text>
              <View className="flex-row gap-2">
                {[3.0, 3.5, 4.0, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => handleRatingChange(rating)}
                    className={cn(
                      'flex-1 py-3 px-3 rounded-lg',
                      filters.minRating === rating
                        ? 'bg-primary'
                        : 'bg-surface border border-border'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-sm font-semibold text-center',
                        filters.minRating === rating ? 'text-white' : 'text-foreground'
                      )}
                    >
                      ⭐ {rating}+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-3">Amenities</Text>
              <View className="flex-row flex-wrap gap-2">
                {AMENITIES.map((amenity) => (
                  <TouchableOpacity
                    key={amenity.id}
                    onPress={() => toggleAmenity(amenity.id)}
                    className={cn(
                      'px-4 py-2 rounded-full border',
                      filters.amenities.includes(amenity.id)
                        ? 'bg-primary border-primary'
                        : 'bg-surface border-border'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-semibold',
                        filters.amenities.includes(amenity.id)
                          ? 'text-white'
                          : 'text-foreground'
                      )}
                    >
                      {amenity.icon} {amenity.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-3">Room Types</Text>
              <View className="flex-row flex-wrap gap-2">
                {ROOM_TYPES.map((roomType) => (
                  <TouchableOpacity
                    key={roomType.id}
                    onPress={() => toggleRoomType(roomType.id)}
                    className={cn(
                      'px-4 py-2 rounded-full border',
                      filters.roomTypes.includes(roomType.id)
                        ? 'bg-primary border-primary'
                        : 'bg-surface border-border'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-semibold',
                        filters.roomTypes.includes(roomType.id)
                          ? 'text-white'
                          : 'text-foreground'
                      )}
                    >
                      {roomType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-8">
              <Text className="text-lg font-bold text-foreground mb-3">Bed Types</Text>
              <View className="flex-row flex-wrap gap-2">
                {BED_TYPES.map((bedType) => (
                  <TouchableOpacity
                    key={bedType.id}
                    onPress={() => toggleBedType(bedType.id)}
                    className={cn(
                      'px-4 py-2 rounded-full border',
                      filters.bedTypes.includes(bedType.id)
                        ? 'bg-primary border-primary'
                        : 'bg-surface border-border'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-semibold',
                        filters.bedTypes.includes(bedType.id)
                          ? 'text-white'
                          : 'text-foreground'
                      )}
                    >
                      {bedType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View className="flex-row gap-3 px-6 py-4 border-t border-border">
            <TouchableOpacity
              onPress={handleReset}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-lg bg-surface border border-border"
            >
              <Text className="text-base font-semibold text-foreground text-center">Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              disabled={isLoading}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg flex-row items-center justify-center',
                isLoading ? 'bg-primary/70' : 'bg-primary'
              )}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">Apply Filters</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
