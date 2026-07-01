/**
 * Landing Page
 * Guest-accessible landing page with search and featured hotels
 * No authentication required
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { HeroSection } from '@/components/feature/hero-section';
import { HotelCard } from '@/components/feature/hotel-card';
import { DestinationCard } from '@/components/feature/destination-card';
import { CountrySelector, CountryCurrencyPicker } from '@/components/feature/country-currency-picker';
import type { Amenity } from '@/types/api';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { DatePickerModal } from '@/components/date-picker-modal';
interface CountryCurrency {
  code: string;
  name: string;
  currency: string;
  currencyCode: string;
  flag: string;
}

// Mock data
const FEATURED_DESTINATIONS = [
  {
    id: '1',
    name: 'Kathmandu',
    country: 'Nepal',
    image: require('@/assets/images/destination-1.jpg'),
    hotels: 245,
    rating: 4.7,
  },
  {
    id: '2',
    name: 'Pokhara',
    country: 'Nepal',
    image: require('@/assets/images/destination-2.jpg'),
    hotels: 156,
    rating: 4.8,
  },
  {
    id: '3',
    name: 'Bhaktapur',
    country: 'Nepal',
    image: require('@/assets/images/destination-3.jpg'),
    hotels: 89,
    rating: 4.6,
  },
  {
    id: '4',
    name: 'Lalitpur',
    country: 'Nepal',
    image: require('@/assets/images/destination-1.jpg'),
    hotels: 112,
    rating: 4.5,
  },
];

const POPULAR_HOTELS = [
  {
    id: '1',
    name: 'Grand Hotel Kathmandu',
    location: 'Kathmandu, Nepal',
    price: 8000,
    currency: 'NPR',
    rating: 4.8,
    reviews: 342,
    image: require('@/assets/images/hotel-1.jpg'),
    amenities: ['WiFi', 'Pool', 'Gym'],
  },
  {
    id: '2',
    name: 'Lake View Resort',
    location: 'Pokhara, Nepal',
    price: 6500,
    currency: 'NPR',
    rating: 4.9,
    reviews: 521,
    image: require('@/assets/images/hotel-2.jpg'),
    amenities: ['WiFi', 'Restaurant', 'Spa'],
  },
  {
    id: '3',
    name: 'Heritage Palace',
    location: 'Bhaktapur, Nepal',
    price: 5500,
    currency: 'NPR',
    rating: 4.7,
    reviews: 289,
    image: require('@/assets/images/hotel-3.jpg'),
    amenities: ['WiFi', 'Parking', 'AC'],
  },
  {
    id: '4',
    name: 'Luxury Suites',
    location: 'Lalitpur, Nepal',
    price: 12000,
    currency: 'NPR',
    rating: 4.9,
    reviews: 418,
    image: require('@/assets/images/hotel-1.jpg'),
    amenities: ['WiFi', 'Pool', 'Gym', 'Spa'],
  },
];

export default function LandingPage() {
  const colors = useColors();
  const [selectedCountry, setSelectedCountry] = useState<CountryCurrency>({
    code: 'NP',
    name: 'Nepal',
    currency: 'Nepalese Rupee',
    currencyCode: 'NPR',
    flag: '🇳🇵',
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [guests, setGuests] = useState('');
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  const handleSearch = () => {
    if (!searchLocation || !checkInDate || !checkOutDate) {
      alert('Please fill in all search fields');
      return;
    }

    router.push({
      pathname: '/guest-search-results',
      params: {
        location: searchLocation,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: guests || '1',
        children: children.toString(),
        rooms: rooms.toString(),
      },
    });
  };

  const handleHotelPress = (hotelId: string) => {
    router.push({
      pathname: '/guest-hotel-detail/[id]',
      params: { id: hotelId },
    });
  };

  const handleDestinationPress = (destination: string) => {
    setSearchLocation(destination);
  };

  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header with Login Button */}
        <View className="px-6 py-4 flex-row items-center justify-between border-b border-border">
          <Text className="text-2xl font-bold text-foreground">Stay Easy</Text>
          <TouchableOpacity
            onPress={handleLoginPress}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary }}
          >
            <Text className="text-sm font-semibold text-white">Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <HeroSection onSearchPress={handleSearch} />

        {/* Search Form */}
        <View className="px-6 py-6 gap-4">
          {/* Country & Currency Selector */}
          <CountrySelector
            selectedCountry={selectedCountry}
            onPress={() => setShowCountryPicker(true)}
          />

          {/* Location Input */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Where to?</Text>
            <View className="flex-row items-center px-4 py-3 rounded-lg border border-border bg-surface">
              <Text className="text-lg mr-2">📍</Text>
              <TextInput
                placeholder="Search destination or hotel"
                placeholderTextColor={colors.muted}
                value={searchLocation}
                onChangeText={setSearchLocation}
                className="flex-1 text-base text-foreground"
              />
            </View>
          </View>

          {/* Check-in Date */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Check-in</Text>
            <TouchableOpacity
              onPress={() => setShowCheckInCalendar(true)}
              className="flex-row items-center px-4 py-3 rounded-lg border border-border bg-surface"
            >
              <Text className="text-lg mr-2">📅</Text>
              <Text className={cn("flex-1 text-base", checkInDate ? "text-foreground" : "text-muted")}>
                {checkInDate || "Select check-in date"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Check-out Date */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Check-out</Text>
            <TouchableOpacity
              onPress={() => setShowCheckOutCalendar(true)}
              className="flex-row items-center px-4 py-3 rounded-lg border border-border bg-surface"
            >
              <Text className="text-lg mr-2">📅</Text>
              <Text className={cn("flex-1 text-base", checkOutDate ? "text-foreground" : "text-muted")}>
                {checkOutDate || "Select check-out date"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Guests */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Guests</Text>
            <View className="flex-row items-center px-4 py-3 rounded-lg border border-border bg-surface">
              <Text className="text-lg mr-2">👥</Text>
              <TextInput
                placeholder="Number of guests"
                placeholderTextColor={colors.muted}
                value={guests}
                onChangeText={setGuests}
                keyboardType="number-pad"
                className="flex-1 text-base text-foreground"
              />
            </View>
          </View>

          {/* Children Counter */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Children</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setChildren(Math.max(0, children - 1))}
                style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 18, color: colors.foreground }}>−</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, minWidth: 24, textAlign: 'center' }}>
                {children}
              </Text>
              <TouchableOpacity
                onPress={() => setChildren(Math.min(10, children + 1))}
                style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 18, color: colors.foreground }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rooms Counter */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Rooms</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setRooms(Math.max(1, rooms - 1))}
                style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 18, color: colors.foreground }}>−</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, minWidth: 24, textAlign: 'center' }}>
                {rooms}
              </Text>
              <TouchableOpacity
                onPress={() => setRooms(Math.min(5, rooms + 1))}
                style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 18, color: colors.foreground }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity
            onPress={handleSearch}
            style={{ paddingHorizontal: 24, paddingVertical: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' }}
          >
            <Text className="text-base font-semibold text-white">Search Hotels</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Destinations */}
        <View className="px-6 py-6 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">Featured Destinations</Text>
            <TouchableOpacity onPress={handleSearch}>
              <Text className="text-sm font-semibold text-primary">See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={FEATURED_DESTINATIONS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleDestinationPress(item.name)}
                style={{ marginRight: 12 }}
              >
                <DestinationCard
                  id={item.id}
                  name={item.name}
                  image={item.image}
                  hotelCount={item.hotels}
                />
              </TouchableOpacity>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
          />
        </View>

        {/* Popular Hotels */}
        <View className="px-6 py-6 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-foreground">Popular Hotels</Text>
            <TouchableOpacity onPress={handleSearch}>
              <Text className="text-sm font-semibold text-primary">See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={POPULAR_HOTELS}
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
                    address: item.location,
                    city: item.location,
                    country: 'Nepal',
                    latitude: 0,
                    longitude: 0,
                    phone: '',
                    email: '',
                    rating: item.rating,
                    review_count: item.reviews,
                    currency: item.currency,
                    photos: [{ url: item.image, caption: '', id: '1', order: 1 }],
                    amenities: item.amenities.map(name => ({ id: '1', name, icon: '✓', category: 'other' })),
                    description: '',
                    property_type: 'Hotel',
                    check_in_time: '14:00',
                    check_out_time: '11:00',
                    cancellation_policy: 'Free cancellation',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }}
                />
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </View>

        {/* Call to Action */}
        <View className="px-6 py-8 gap-4 bg-primary/10 rounded-2xl mx-6 mb-6">
          <Text className="text-2xl font-bold text-foreground text-center">
            Ready to Book?
          </Text>
          <Text className="text-base text-muted text-center">
            Sign in to your account to make a reservation and save your favorite hotels.
          </Text>
          <TouchableOpacity
            onPress={handleLoginPress}
            style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' }}
          >
            <Text className="text-base font-semibold text-white">Sign In Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Country Currency Picker Modal */}
      <CountryCurrencyPicker
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onSelect={(country) => setSelectedCountry(country)}
        selectedCountry={selectedCountry}
      />

      {/* Check-in Calendar Modal */}
      <DatePickerModal
        visible={showCheckInCalendar}
        onClose={() => setShowCheckInCalendar(false)}
        onSelect={(date) => {
          setCheckInDate(date);
          if (checkOutDate && date >= checkOutDate) {
            setCheckOutDate('');
          }
        }}
        title="Select Check-in Date"
        selectedDate={checkInDate}
      />

      {/* Check-out Calendar Modal */}
      <DatePickerModal
        visible={showCheckOutCalendar}
        onClose={() => setShowCheckOutCalendar(false)}
        onSelect={(date) => setCheckOutDate(date)}
        title="Select Check-out Date"
        selectedDate={checkOutDate}
        minDate={checkInDate || undefined}
      />
    </ScreenContainer>
  );
}
