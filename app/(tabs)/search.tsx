/**
 * Search Screen
 * Hotel search form with date picker, guest count, and location input
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export default function SearchScreen() {
  const colors = useColors();

  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [location, setLocation] = useState('');
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState(1);

  const handleSearch = () => {
    if (!checkInDate || !checkOutDate || !location) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }
    router.push({
      pathname: '/guest-search-results',
      params: { location, checkIn: checkInDate, checkOut: checkOutDate, guests: guests.toString() },
    });
  };

  const incrementGuests = () => {
    if (guests < 10) setGuests(guests + 1);
  };

  const decrementGuests = () => {
    if (guests > 1) setGuests(guests - 1);
  };

  const incrementRooms = () => {
    if (rooms < 5) setRooms(rooms + 1);
  };

  const decrementRooms = () => {
    if (rooms > 1) setRooms(rooms - 1);
  };

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 py-8 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Find Hotels</Text>
            <Text className="text-base text-muted">Search and book your perfect stay</Text>
          </View>

          {/* Search Form */}
          <View className="gap-6">
            {/* Location Input */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Location</Text>
              <View className="flex-row items-center px-4 py-3 rounded-lg border border-border bg-surface">
                <Text className="text-xl mr-2">📍</Text>
                <TextInput
                  placeholder="Enter city or hotel name"
                  placeholderTextColor={colors.muted}
                  value={location}
                  onChangeText={setLocation}
                  className="flex-1 text-base text-foreground"
                />
              </View>
            </View>

            {/* Check-in Date */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Check-in Date</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Date Picker', 'Date picker would open here')}
                className="flex-row items-center px-4 py-3 rounded-lg border border-border bg-surface"
              >
                <Text className="text-xl mr-2">📅</Text>
                <Text className={cn('text-base flex-1', checkInDate ? 'text-foreground' : 'text-muted')}>
                  {checkInDate || 'Select check-in date'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Check-out Date */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Check-out Date</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Date Picker', 'Date picker would open here')}
                className="flex-row items-center px-4 py-3 rounded-lg border border-border bg-surface"
              >
                <Text className="text-xl mr-2">📅</Text>
                <Text className={cn('text-base flex-1', checkOutDate ? 'text-foreground' : 'text-muted')}>
                  {checkOutDate || 'Select check-out date'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Guests and Rooms */}
            <View className="flex-row gap-4">
              {/* Guests */}
              <View className="flex-1 gap-2">
                <Text className="text-sm font-semibold text-foreground">Guests</Text>
                <Card variant="default" padding="md" className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={decrementGuests}
                    className="w-8 h-8 items-center justify-center rounded-full bg-primary/10"
                  >
                    <Text className="text-lg font-bold text-primary">−</Text>
                  </TouchableOpacity>
                  <Text className="text-lg font-semibold text-foreground">{guests}</Text>
                  <TouchableOpacity
                    onPress={incrementGuests}
                    className="w-8 h-8 items-center justify-center rounded-full bg-primary/10"
                  >
                    <Text className="text-lg font-bold text-primary">+</Text>
                  </TouchableOpacity>
                </Card>
              </View>

              {/* Rooms */}
              <View className="flex-1 gap-2">
                <Text className="text-sm font-semibold text-foreground">Rooms</Text>
                <Card variant="default" padding="md" className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={decrementRooms}
                    className="w-8 h-8 items-center justify-center rounded-full bg-primary/10"
                  >
                    <Text className="text-lg font-bold text-primary">−</Text>
                  </TouchableOpacity>
                  <Text className="text-lg font-semibold text-foreground">{rooms}</Text>
                  <TouchableOpacity
                    onPress={incrementRooms}
                    className="w-8 h-8 items-center justify-center rounded-full bg-primary/10"
                  >
                    <Text className="text-lg font-bold text-primary">+</Text>
                  </TouchableOpacity>
                </Card>
              </View>
            </View>

            {/* Search Button */}
            <Button
              onPress={handleSearch}
              variant="primary"
              size="lg"
              fullWidth
              className="mt-4"
            >
              Search Hotels
            </Button>

            {/* Quick Filters */}
            <View className="gap-3 mt-4">
              <Text className="text-sm font-semibold text-foreground">Quick Filters</Text>
              <View className="flex-row gap-2 flex-wrap">
                {['Budget', 'Luxury', 'Near Me', 'Best Rated'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    className="px-4 py-2 rounded-full border border-border bg-surface"
                  >
                    <Text className="text-sm text-foreground">{filter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
