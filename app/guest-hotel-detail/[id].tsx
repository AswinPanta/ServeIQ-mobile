/**
 * Guest Hotel Detail Screen
 * Hotel details accessible without authentication
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { UrgencyBadge } from '@/components/feature/urgency-badge';
import { useColors } from '@/hooks/use-colors';
import { Image } from 'react-native';
import { getHotelById, type Hotel } from '@/lib/mock/properties';

export default function GuestHotelDetail() {
  const colors = useColors();
  const { id, checkIn, checkOut, guests } = useLocalSearchParams();
  const [selectedImage, setSelectedImage] = useState(0);

  // Get hotel from mock data
  const hotelData = getHotelById(id as string);
  
  // Fallback to default if not found
  const hotel: Hotel = hotelData || {
    id: id as string,
    name: 'Grand Hotel Kathmandu',
    location: 'Thamel, Kathmandu',
    city: 'Kathmandu',
    country: 'Nepal',
    address: 'Thamel Marg, Kathmandu 44600, Nepal',
    rating: 4.8,
    review_count: 342,
    starRating: 5,
    price: 8000,
    currency: 'NPR',
    description:
      'Experience luxury and comfort at our 5-star hotel in the heart of Kathmandu.',
    shortDescription: '5-star luxury in the heart of Thamel',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop',
    ],
    amenities: [
      { name: 'Free WiFi', icon: '📶' },
      { name: 'Swimming Pool', icon: '🏊' },
      { name: 'Fitness Center', icon: '💪' },
      { name: 'Restaurant', icon: '🍽️' },
      { name: 'Parking', icon: '🅿️' },
      { name: 'Spa', icon: '✨' },
      { name: 'Air Conditioning', icon: '❄️' },
      { name: 'TV', icon: '📺' },
    ],
    roomTypes: [
      {
        id: 'standard-1',
        name: 'Standard Room',
        price: 5000,
        currency: 'NPR',
        occupancy: 2,
        bed: 'Double Bed',
        description: 'Cozy room with basic amenities',
        available: 5,
        amenities: ['WiFi', 'AC', 'TV'],
        image: 'https://via.placeholder.com/400x300?text=Standard+Room',
      },
      {
        id: 'deluxe-1',
        name: 'Deluxe Room',
        price: 8000,
        currency: 'NPR',
        occupancy: 2,
        bed: 'King Bed',
        description: 'Spacious room with premium amenities',
        available: 3,
        amenities: ['WiFi', 'AC', 'TV', 'Mini Bar'],
        image: 'https://via.placeholder.com/400x300?text=Deluxe+Room',
      },
      {
        id: 'suite-1',
        name: 'Suite',
        price: 15000,
        currency: 'NPR',
        occupancy: 4,
        bed: 'King Bed + Sofa',
        description: 'Luxury suite with separate living area',
        available: 1,
        amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony'],
        image: 'https://via.placeholder.com/400x300?text=Suite',
      },
    ],
    reviews: [
      {
        id: 'r1',
        author: 'John Doe',
        rating: 5,
        date: '2026-06-15',
        comment: 'Excellent hotel with great service and comfortable rooms!',
        helpful: 12,
      },
      {
        id: 'r2',
        author: 'Jane Smith',
        rating: 4,
        date: '2026-06-10',
        comment: 'Good location and friendly staff. Highly recommended.',
        helpful: 8,
      },
    ],
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    phone: '+977-1-4123456',
    email: 'info@grandhotel.com',
    availableRooms: 10,
    tags: ['Luxury', 'Restaurant', 'Spa'],
  };

  const handleBookNow = () => {
    router.push({
      pathname: '/booking-flow',
      params: {
        id: hotel.id,
        hotelName: hotel.name,
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        guests: guests || '1',
      },
    });
  };

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center gap-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground flex-1">Hotel Details</Text>
          <Text className="text-2xl">❤️</Text>
        </View>

        {/* Image Gallery */}
        <View className="px-6 py-4 gap-2">
          <View className="h-48 rounded-lg bg-surface items-center justify-center border border-border overflow-hidden">
            <Image
              source={hotel.images[selectedImage]}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <View className="flex-row gap-2">
            {hotel.images.map((image, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedImage(index)}
                style={{
                  flex: 1,
                  height: 64,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  overflow: 'hidden',
                  borderColor: selectedImage === index ? colors.primary : colors.border,
                  backgroundColor: selectedImage === index ? `${colors.primary}10` : colors.surface,
                }}
              >
                <Image
                  source={image}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Hotel Info */}
        <View className="px-6 py-4 gap-3">
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">{hotel.name}</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-bold text-primary">⭐ {hotel.rating}</Text>
              <Text className="text-sm text-muted">({hotel.review_count} reviews)</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-sm text-muted">📍</Text>
              <Text className="text-sm text-muted">{hotel.location}</Text>
            </View>
          </View>

          <Text className="text-base text-foreground leading-relaxed">{hotel.description}</Text>
        </View>

        {/* Price */}
        <View className="px-6 py-4 bg-primary/10 rounded-lg mx-6 gap-2">
          <Text className="text-sm text-muted">Price per night</Text>
          <Text className="text-3xl font-bold text-primary">
            {hotel.currency} {hotel.price}
          </Text>
          {checkIn && checkOut && (
            <Text className="text-xs text-muted">
              {checkIn} → {checkOut}
            </Text>
          )}
        </View>

        {/* Amenities */}
        <View className="px-6 py-6 gap-3">
          <Text className="text-lg font-bold text-foreground">Amenities</Text>
          <View className="flex-row flex-wrap gap-2">
            {hotel.amenities.map((amenity, index) => (
              <Card key={index} variant="default" padding="sm" className="gap-1">
                <Text className="text-xl">{amenity.icon}</Text>
                <Text className="text-xs font-semibold text-foreground text-center">
                  {amenity.name}
                </Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Room Types */}
        <View className="px-6 py-6 gap-3">
          <Text className="text-lg font-bold text-foreground">Room Types</Text>
          {hotel.roomTypes.map((room) => (
            <Card key={room.id} variant="outlined" padding="md" className="gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 gap-1">
                  <Text className="text-base font-semibold text-foreground">{room.name}</Text>
                  <Text className="text-xs text-muted">{room.description}</Text>
                  <Text className="text-xs text-muted">
                    {room.bed} • {room.occupancy} guests
                  </Text>
                </View>
                <Text className="text-lg font-bold text-primary">{hotel.currency} {room.price}</Text>
              </View>
              <UrgencyBadge count={room.available} />
            </Card>
          ))}
        </View>

        {/* Check-in/Check-out */}
        <View className="px-6 py-6 gap-3">
          <Text className="text-lg font-bold text-foreground">Check-in & Check-out</Text>
          <View className="flex-row gap-3">
            <Card variant="default" padding="md" className="flex-1 gap-1">
              <Text className="text-xs text-muted">Check-in</Text>
              <Text className="text-base font-semibold text-foreground">{hotel.checkInTime}</Text>
            </Card>
            <Card variant="default" padding="md" className="flex-1 gap-1">
              <Text className="text-xs text-muted">Check-out</Text>
              <Text className="text-base font-semibold text-foreground">{hotel.checkOutTime}</Text>
            </Card>
          </View>
        </View>

        {/* Cancellation Policy */}
        <View className="px-6 py-6 gap-3">
          <Text className="text-lg font-bold text-foreground">Cancellation Policy</Text>
          <Card variant="default" padding="md">
            <Text className="text-sm text-foreground">{hotel.cancellationPolicy}</Text>
          </Card>
        </View>

        {/* Reviews */}
        <View className="px-6 py-6 gap-3">
          <Text className="text-lg font-bold text-foreground">Guest Reviews</Text>
          {hotel.reviews.map((review) => (
            <Card key={review.id} variant="outlined" padding="md" className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">{review.author}</Text>
                <Text className="text-sm font-bold text-primary">⭐ {review.rating}</Text>
              </View>
              <Text className="text-xs text-muted">{review.date}</Text>
              <Text className="text-sm text-foreground">{review.comment}</Text>
            </Card>
          ))}
        </View>

        {/* Contact */}
        <View className="px-6 py-6 gap-3">
          <Text className="text-lg font-bold text-foreground">Contact Information</Text>
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">📞</Text>
              <Text className="text-sm text-foreground">{hotel.phone}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-lg">📧</Text>
              <Text className="text-sm text-foreground">{hotel.email}</Text>
            </View>
          </View>
        </View>

        {/* Book Now Button */}
        <View className="px-6 py-6 pb-20">
          <TouchableOpacity
            onPress={handleBookNow}
            style={{ paddingHorizontal: 24, paddingVertical: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center' }}
            activeOpacity={0.7}
          >
            <Text className="text-base font-semibold text-white">Book Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
